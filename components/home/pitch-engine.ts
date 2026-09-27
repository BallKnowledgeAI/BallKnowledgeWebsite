/*
 * Live pitch engine for the home page.
 *
 * MatchSim  – a light 11v11 simulation (team shape, pressing, passing, shots).
 * View      – a perspective "broadcast camera" that projects pitch metres to
 *             canvas pixels and back (so clicks land on the real grass spot).
 * drawPitch – renders one frame using colours read from the brand tokens.
 *
 * World units are metres. x runs along the pitch (blue attacks +x),
 * z runs across it, y is height.
 */

export const HALF_L = 52.5
export const HALF_W = 34

export type Team = 'blue' | 'green'
export type Mode = 'balanced' | 'press' | 'counter'
export type Phase = 'build-up' | 'progression' | 'final-third' | 'transition' | 'pressing' | 'defensive-shape'
export type Vec = { x: number; z: number }
export type MatchEvent = {
  type: 'goal' | 'save' | 'interception' | 'tackle' | 'called-pass' | 'counterpress'
  team: Team
  role?: string
}

type Player = {
  team: Team
  role: string
  home: Vec
  pos: Vec
  vel: Vec
  run: Vec | null
  runUntil: number
}

type BallState =
  | { kind: 'held'; carrier: number }
  | { kind: 'flight'; team: Team; from: Vec; to: Vec; t: number; dur: number; receiver: number | null; shot: boolean; lift: number }

const BLUE_433: [string, number, number][] = [
  ['GK', -48, 0], ['LB', -30, -22], ['LCB', -34, -8], ['RCB', -34, 8], ['RB', -30, 22],
  ['LCM', -14, -12], ['CDM', -20, 0], ['RCM', -14, 12], ['LW', 4, -24], ['ST', 8, 0], ['RW', 4, 24],
]

const GREEN_442: [string, number, number][] = [
  ['GK', 48, 0], ['RB', 32, -20], ['RCB', 35, -7], ['LCB', 35, 7], ['LB', 32, 20],
  ['RM', 16, -22], ['RCM', 18, -7], ['LCM', 18, 7], ['LM', 16, 22], ['ST', 4, -5], ['ST', 4, 5],
]

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z)
const dirOf = (team: Team) => (team === 'blue' ? 1 : -1)
const other = (team: Team): Team => (team === 'blue' ? 'green' : 'blue')
const inPitch = (point: Vec): Vec => ({ x: clamp(point.x, -HALF_L + 1, HALF_L - 1), z: clamp(point.z, -HALF_W + 1, HALF_W - 1) })

const makePlayer = (team: Team, [role, x, z]: [string, number, number]): Player => ({
  team,
  role,
  home: { x, z },
  pos: { x, z },
  vel: { x: 0, z: 0 },
  run: null,
  runUntil: 0,
})

export class MatchSim {
  players: Player[]
  ball = { x: 0, y: 0, z: 0 }
  state: BallState
  mode: Mode = 'balanced'
  time = 0
  possession: Team = 'blue'
  regainAt = -10
  score = { blue: 0, green: 0 }
  passes = { blue: 0, green: 0 }
  possessionTime = { blue: 0.01, green: 0.01 }
  counterpressUntil = 0
  ripples: { x: number; z: number; t: number }[] = []
  onEvent?: (event: MatchEvent) => void
  private held = 0
  private holdFor = 1.4
  private pressure = 0

  constructor() {
    this.players = [...BLUE_433.map((row) => makePlayer('blue', row)), ...GREEN_442.map((row) => makePlayer('green', row))]
    this.state = { kind: 'held', carrier: 6 }
  }

  get carrierIndex() {
    return this.state.kind === 'held' ? this.state.carrier : null
  }

  get pressureLevel() {
    return clamp(this.pressure / 0.6, 0, 1)
  }

  ballGround(): Vec {
    return { x: this.ball.x, z: this.ball.z }
  }

  warm(seconds: number) {
    const handler = this.onEvent
    this.onEvent = undefined
    for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 30) this.step(1 / 30)
    this.onEvent = handler
    // The clock opens at 52', so start from a plausible first-half split.
    this.passes = { blue: 0, green: 0 }
    this.possessionTime = { blue: 1716, green: 1404 }
  }

  step(rawDt: number) {
    const dt = Math.min(rawDt, 0.05)
    this.time += dt
    this.possessionTime[this.possession] += dt

    const ball = this.ballGround()
    const targets: Vec[] = []
    const speeds: number[] = []

    this.players.forEach((player, index) => {
      const direction = dirOf(player.team)
      const inPossession = player.team === this.possession
      const isKeeper = player.role === 'GK'
      const roleFactor = isKeeper ? 0.12 : 1
      let push = inPossession ? direction * 5 : -direction * 3

      if (player.team === 'blue') {
        if (this.mode === 'press' && !inPossession) push += direction * 9
        if (this.mode === 'counter' && !inPossession) push -= direction * 9
        if (this.mode === 'counter' && inPossession && direction * player.home.x > 0) push += direction * 6
      }

      const width = inPossession ? 1.12 : 0.78
      let target: Vec = inPitch({
        x: player.home.x + (ball.x * 0.42 + push) * roleFactor,
        z: player.home.z * width + ball.z * (isKeeper ? 0.08 : 0.32),
      })
      let speed = 6.2

      if (player.run && this.time < player.runUntil) {
        target = player.run
        speed = 8
      }

      if (this.state.kind === 'held' && this.state.carrier === index) {
        target = inPitch({ x: player.pos.x + direction * 4, z: player.pos.z * 0.96 })
        speed = 4.2
      }

      targets.push(target)
      speeds.push(speed)
    })

    // The team without the ball sends its nearest players to press it.
    const defending = other(this.possession)
    let presserCount = 2
    if (defending === 'blue') {
      presserCount = this.mode === 'press' ? 3 : this.mode === 'counter' ? 1 : 2
      if (this.time < this.counterpressUntil) presserCount = 4
    }
    this.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => player.team === defending && player.role !== 'GK')
      .sort((a, b) => dist(a.player.pos, ball) - dist(b.player.pos, ball))
      .slice(0, presserCount)
      .forEach(({ index }) => {
        targets[index] = { x: ball.x - dirOf(defending) * 0.9, z: ball.z }
        speeds[index] = 7.8
      })

    this.players.forEach((player, index) => {
      const target = targets[index]
      let desiredX = (target.x - player.pos.x) * 1.4
      let desiredZ = (target.z - player.pos.z) * 1.4
      const length = Math.hypot(desiredX, desiredZ)
      if (length > speeds[index]) {
        desiredX = (desiredX / length) * speeds[index]
        desiredZ = (desiredZ / length) * speeds[index]
      }
      const blend = Math.min(1, dt * 3.2)
      player.vel.x += (desiredX - player.vel.x) * blend
      player.vel.z += (desiredZ - player.vel.z) * blend
      player.pos.x += player.vel.x * dt
      player.pos.z += player.vel.z * dt
    })

    this.stepBall(dt)

    this.ripples.forEach((ripple) => {
      ripple.t += dt
    })
    this.ripples = this.ripples.filter((ripple) => ripple.t < 1.2)
  }

  private stepBall(dt: number) {
    const state = this.state

    if (state.kind === 'held') {
      const carrier = this.players[state.carrier]
      const direction = dirOf(carrier.team)
      this.ball.x = carrier.pos.x + direction * 0.75
      this.ball.z = carrier.pos.z
      this.ball.y = 0
      this.held += dt

      const nearest = this.nearestOpponent(state.carrier, carrier.pos)
      if (nearest && nearest.distance < 1.6) this.pressure += dt
      else this.pressure = Math.max(0, this.pressure - dt)

      if (nearest && this.pressure > 0.6 && Math.random() < dt * 1.1) {
        this.setCarrier(nearest.index)
        this.emit({ type: 'tackle', team: this.players[nearest.index].team, role: this.players[nearest.index].role })
      } else if (this.held > this.holdFor) {
        this.decide()
      }
      return
    }

    state.t += dt
    const progress = clamp(state.t / state.dur, 0, 1)
    this.ball.x = state.from.x + (state.to.x - state.from.x) * progress
    this.ball.z = state.from.z + (state.to.z - state.from.z) * progress
    this.ball.y = 4 * state.lift * progress * (1 - progress)
    if (progress >= 1) this.resolveFlight(state)
  }

  private nearestOpponent(index: number, point: Vec) {
    const team = this.players[index].team
    let best: { index: number; distance: number } | null = null
    this.players.forEach((player, candidate) => {
      if (player.team === team) return
      const distance = dist(player.pos, point)
      if (!best || distance < best.distance) best = { index: candidate, distance }
    })
    return best as { index: number; distance: number } | null
  }

  private setCarrier(index: number) {
    const team = this.players[index].team
    if (team !== this.possession) {
      this.possession = team
      this.regainAt = this.time
    }
    this.state = { kind: 'held', carrier: index }
    this.held = 0
    this.holdFor = rand(0.9, 1.9)
    this.pressure = 0
  }

  /** Teammates ranked by how good a pass to them looks right now. */
  options(carrierIndex: number) {
    const carrier = this.players[carrierIndex]
    const direction = dirOf(carrier.team)
    return this.players
      .map((player, index) => ({ player, index }))
      .filter(({ player, index }) => player.team === carrier.team && index !== carrierIndex && player.role !== 'GK')
      .map(({ player, index }) => {
        const distance = dist(player.pos, carrier.pos)
        const openness = Math.min(
          10,
          ...this.players.filter((opponent) => opponent.team !== carrier.team).map((opponent) => dist(opponent.pos, player.pos)),
        )
        const progress = (direction * (player.pos.x - carrier.pos.x)) / 10
        const score = progress + openness / 3 - Math.abs(distance - 18) / 10
        return { index, score, distance }
      })
      .filter((option) => option.distance > 6 && option.distance < 40)
      .sort((a, b) => b.score - a.score)
  }

  private decide() {
    if (this.state.kind !== 'held') return
    const carrierIndex = this.state.carrier
    const carrier = this.players[carrierIndex]
    const direction = dirOf(carrier.team)

    if (direction * carrier.pos.x > 30 && Math.random() < 0.55) {
      this.launch(carrier.team, { x: direction * HALF_L, z: rand(-3, 3) }, null, true)
      return
    }

    const ranked = this.options(carrierIndex)
    if (ranked.length === 0) {
      this.holdFor += 0.5
      return
    }
    const pick = ranked[Math.min(ranked.length - 1, Math.floor(Math.random() * Math.random() * 3))]
    const receiver = this.players[pick.index]
    this.launch(carrier.team, inPitch({ x: receiver.pos.x + receiver.vel.x * 0.4, z: receiver.pos.z + receiver.vel.z * 0.4 }), pick.index, false)
  }

  private launch(team: Team, to: Vec, receiver: number | null, shot: boolean) {
    const from = this.ballGround()
    const distance = dist(from, to)
    const dur = clamp(distance / (shot ? 26 : 19), 0.35, 1.3)
    const lift = shot ? 1.2 : distance > 22 ? distance * 0.09 : 0.25
    if (receiver !== null) {
      this.players[receiver].run = to
      this.players[receiver].runUntil = this.time + dur + 0.2
      this.passes[team] += 1
    }
    this.state = { kind: 'flight', team, from, to, t: 0, dur, receiver, shot, lift }
  }

  private resolveFlight(flight: Extract<BallState, { kind: 'flight' }>) {
    if (flight.shot) {
      const opponents = other(flight.team)
      if (Math.random() < 0.34) {
        this.score[flight.team] += 1
        this.emit({ type: 'goal', team: flight.team })
        const restart = this.players.findIndex((player) => player.team === opponents && player.role === (opponents === 'blue' ? 'CDM' : 'RCM'))
        this.players[restart].pos = { x: 0, z: 0 }
        this.ball.x = 0
        this.ball.z = 0
        this.setCarrier(restart)
      } else {
        this.emit({ type: 'save', team: opponents })
        this.setCarrier(this.players.findIndex((player) => player.team === opponents && player.role === 'GK'))
      }
      return
    }

    if (flight.receiver === null) {
      const nearest = this.players
        .map((player, index) => ({ index, distance: dist(player.pos, flight.to), team: player.team }))
        .sort((a, b) => a.distance - b.distance)[0]
      this.setCarrier(nearest.index)
      return
    }

    const interceptor = this.nearestOpponent(flight.receiver, flight.to)
    const interceptChance = flight.team === 'blue' ? 0.22 : 0.3
    if (interceptor && interceptor.distance < 1.8 && Math.random() < interceptChance) {
      this.setCarrier(interceptor.index)
      this.emit({ type: 'interception', team: this.players[interceptor.index].team, role: this.players[interceptor.index].role })
      return
    }
    this.setCarrier(flight.receiver)
  }

  /** The viewer points at the grass: blue plays the ball there, or counter-presses if green has it. */
  callPass(point: Vec) {
    const target = inPitch(point)
    this.ripples.push({ x: target.x, z: target.z, t: 0 })

    if (this.possession === 'green') {
      this.counterpressUntil = this.time + 2.5
      this.emit({ type: 'counterpress', team: 'blue' })
      return
    }

    if (this.state.kind !== 'held') return
    const carrierIndex = this.state.carrier
    const receiver = this.players
      .map((player, index) => ({ player, index }))
      .filter(({ player, index }) => player.team === 'blue' && index !== carrierIndex && player.role !== 'GK')
      .sort((a, b) => dist(a.player.pos, target) - dist(b.player.pos, target))[0]
    if (!receiver) return
    this.launch('blue', target, receiver.index, false)
    this.emit({ type: 'called-pass', team: 'blue', role: receiver.player.role })
  }

  phase(): Phase {
    if (this.possession === 'blue') {
      if (this.time - this.regainAt < 3.5) return 'transition'
      if (this.ball.x < -17) return 'build-up'
      if (this.ball.x > 17) return 'final-third'
      return 'progression'
    }
    const ball = this.ballGround()
    const pressers = this.players.filter((player) => player.team === 'blue' && dist(player.pos, ball) < 6).length
    return pressers >= 2 ? 'pressing' : 'defensive-shape'
  }

  private emit(event: MatchEvent) {
    this.onEvent?.(event)
  }
}

/* ---------- camera ---------- */

export type Camera = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; fov: number }
type V3 = [number, number, number]

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const normalize = (a: V3): V3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / length, a[1] / length, a[2] / length]
}

const NEAR = 0.4

export class View {
  width = 1
  height = 1
  private pos: V3 = [0, 10, 40]
  private forward: V3 = [0, 0, -1]
  private right: V3 = [1, 0, 0]
  private up: V3 = [0, 1, 0]
  private focal = 1

  set(camera: Camera, width: number, height: number) {
    this.width = width
    this.height = height
    this.pos = [camera.px, camera.py, camera.pz]
    this.forward = normalize(sub([camera.tx, camera.ty, camera.tz], this.pos))
    this.right = normalize(cross(this.forward, [0, 1, 0]))
    this.up = cross(this.right, this.forward)
    this.focal = height / 2 / Math.tan((camera.fov * Math.PI) / 360)
  }

  toCamera(x: number, y: number, z: number): V3 {
    const relative = sub([x, y, z], this.pos)
    return [dot(relative, this.right), dot(relative, this.up), dot(relative, this.forward)]
  }

  toScreen(point: V3) {
    return {
      x: this.width / 2 + (this.focal * point[0]) / point[2],
      y: this.height / 2 - (this.focal * point[1]) / point[2],
      scale: this.focal / point[2],
    }
  }

  project(x: number, y: number, z: number) {
    const point = this.toCamera(x, y, z)
    if (point[2] < NEAR) return null
    return { ...this.toScreen(point), depth: point[2] }
  }

  /** Screen pixel → spot on the grass, or null if the pixel is above the horizon. */
  unproject(sx: number, sy: number): Vec | null {
    const dx = sx - this.width / 2
    const dy = -(sy - this.height / 2)
    const direction: V3 = [
      this.forward[0] * this.focal + this.right[0] * dx + this.up[0] * dy,
      this.forward[1] * this.focal + this.right[1] * dx + this.up[1] * dy,
      this.forward[2] * this.focal + this.right[2] * dx + this.up[2] * dy,
    ]
    if (direction[1] > -1e-6) return null
    const t = -this.pos[1] / direction[1]
    return { x: this.pos[0] + direction[0] * t, z: this.pos[2] + direction[2] * t }
  }

  /** Clip a polygon on the ground (or at height y) against the near plane and trace it. */
  tracePolygon(ctx: CanvasRenderingContext2D, points: Vec[], y = 0) {
    const input = points.map((point) => this.toCamera(point.x, y, point.z))
    const output: V3[] = []
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index]
      const previous = input[(index + input.length - 1) % input.length]
      const currentIn = current[2] >= NEAR
      const previousIn = previous[2] >= NEAR
      if (currentIn !== previousIn) {
        const t = (NEAR - previous[2]) / (current[2] - previous[2])
        output.push([previous[0] + (current[0] - previous[0]) * t, previous[1] + (current[1] - previous[1]) * t, NEAR])
      }
      if (currentIn) output.push(current)
    }
    if (output.length < 3) return false
    ctx.beginPath()
    output.forEach((point, index) => {
      const screen = this.toScreen(point)
      if (index === 0) ctx.moveTo(screen.x, screen.y)
      else ctx.lineTo(screen.x, screen.y)
    })
    ctx.closePath()
    return true
  }

  /** Add a near-plane-clipped segment to the current path. */
  segment(ctx: CanvasRenderingContext2D, a: V3, b: V3) {
    let start = this.toCamera(a[0], a[1], a[2])
    let end = this.toCamera(b[0], b[1], b[2])
    if (start[2] < NEAR && end[2] < NEAR) return
    if (start[2] < NEAR || end[2] < NEAR) {
      const t = (NEAR - start[2]) / (end[2] - start[2])
      const cut: V3 = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, NEAR]
      if (start[2] < NEAR) start = cut
      else end = cut
    }
    const s = this.toScreen(start)
    const e = this.toScreen(end)
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(e.x, e.y)
  }

  polyline(ctx: CanvasRenderingContext2D, points: V3[]) {
    for (let index = 1; index < points.length; index += 1) this.segment(ctx, points[index - 1], points[index])
  }
}

/* ---------- colours ---------- */

export type Palette = {
  primary: string
  primaryBright: string
  green: string
  accent: string
  amber: string
  text: string
  surface: string
  bg: string
  font: string
  isLight: boolean
}

export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element)
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    primary: token('--primary', 'rgb(59,167,240)'),
    primaryBright: token('--primary-bright', 'rgb(96,187,255)'),
    green: token('--green', 'rgb(46,204,113)'),
    accent: token('--accent', 'rgb(0,201,255)'),
    amber: token('--amber', 'rgb(255,209,102)'),
    text: token('--text', 'rgb(240,246,255)'),
    surface: token('--surface', 'rgb(10,16,32)'),
    bg: token('--bg', 'rgb(4,8,15)'),
    font: token('--font-dm-sans', 'sans-serif'),
    isLight: document.documentElement.getAttribute('data-theme') === 'light',
  }
}

/** Tint any token colour (hex or rgb/rgba) for canvas, which can't take color-mix(). */
export function tint(color: string, alpha: number) {
  const value = color.trim()
  let r = 0
  let g = 0
  let b = 0
  if (value.startsWith('#')) {
    const hex = value.length === 4 ? value.slice(1).split('').map((c) => c + c).join('') : value.slice(1, 7)
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else {
    const parts = value.match(/[\d.]+/g) ?? ['0', '0', '0']
    ;[r, g, b] = parts.slice(0, 3).map(Number)
  }
  return `rgba(${r},${g},${b},${alpha})`
}

/* ---------- rendering ---------- */

const ring = (cx: number, cz: number, radius: number, segments = 40): V3[] =>
  Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2
    return [cx + Math.cos(angle) * radius, 0, cz + Math.sin(angle) * radius] as V3
  })

const arc = (cx: number, cz: number, radius: number, from: number, to: number, segments = 24): V3[] =>
  Array.from({ length: segments + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / segments
    return [cx + Math.cos(angle) * radius, 0, cz + Math.sin(angle) * radius] as V3
  })

export type DrawState = {
  hover: Vec | null
  hoveredPlayer: number | null
  time: number
}

export function drawPitch(ctx: CanvasRenderingContext2D, view: View, sim: MatchSim, palette: Palette, dpr: number, draw: DrawState) {
  const { width, height } = view
  ctx.clearRect(0, 0, width, height)
  const lineAlpha = palette.isLight ? 0.5 : 0.42

  // Grass: brand navy surface with mowing stripes.
  ctx.fillStyle = tint(palette.surface, palette.isLight ? 0.7 : 0.82)
  if (view.tracePolygon(ctx, [{ x: -HALF_L - 4, z: -HALF_W - 4 }, { x: HALF_L + 4, z: -HALF_W - 4 }, { x: HALF_L + 4, z: HALF_W + 4 }, { x: -HALF_L - 4, z: HALF_W + 4 }])) ctx.fill()
  ctx.fillStyle = tint(palette.primary, palette.isLight ? 0.05 : 0.045)
  const stripe = (HALF_L * 2) / 12
  for (let index = 0; index < 12; index += 2) {
    const x0 = -HALF_L + index * stripe
    if (view.tracePolygon(ctx, [{ x: x0, z: -HALF_W }, { x: x0 + stripe, z: -HALF_W }, { x: x0 + stripe, z: HALF_W }, { x: x0, z: HALF_W }])) ctx.fill()
  }

  // Tactical zone around the ball once the attack gets serious.
  const phase = sim.phase()
  const ball = sim.ballGround()
  if (phase === 'final-third' || phase === 'pressing') {
    const zone = Array.from({ length: 36 }, (_, index) => {
      const angle = (index / 36) * Math.PI * 2
      return { x: ball.x + Math.cos(angle) * 11, z: ball.z + Math.sin(angle) * 8 }
    })
    const zoneColor = phase === 'pressing' ? palette.green : palette.primary
    if (view.tracePolygon(ctx, zone)) {
      ctx.fillStyle = tint(zoneColor, 0.08)
      ctx.fill()
      ctx.setLineDash([6 * dpr, 6 * dpr])
      ctx.lineDashOffset = -draw.time * 18 * dpr
      ctx.strokeStyle = tint(zoneColor, 0.5)
      ctx.lineWidth = 1.2 * dpr
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Markings.
  ctx.strokeStyle = tint(palette.primary, lineAlpha)
  ctx.lineWidth = 1.4 * dpr
  ctx.beginPath()
  view.polyline(ctx, [[-HALF_L, 0, -HALF_W], [HALF_L, 0, -HALF_W], [HALF_L, 0, HALF_W], [-HALF_L, 0, HALF_W], [-HALF_L, 0, -HALF_W]])
  view.segment(ctx, [0, 0, -HALF_W], [0, 0, HALF_W])
  view.polyline(ctx, ring(0, 0, 9.15, 48))
  for (const side of [-1, 1]) {
    const goalLine = side * HALF_L
    view.polyline(ctx, [[goalLine, 0, -20.16], [goalLine - side * 16.5, 0, -20.16], [goalLine - side * 16.5, 0, 20.16], [goalLine, 0, 20.16]])
    view.polyline(ctx, [[goalLine, 0, -9.16], [goalLine - side * 5.5, 0, -9.16], [goalLine - side * 5.5, 0, 9.16], [goalLine, 0, 9.16]])
    const spot = goalLine - side * 11
    const reach = Math.acos(5.5 / 9.15)
    view.polyline(ctx, side > 0 ? arc(spot, 0, 9.15, Math.PI - reach, Math.PI + reach, 16) : arc(spot, 0, 9.15, -reach, reach, 16))
    for (const corner of [-1, 1]) {
      const inward = Math.atan2(-corner, -side)
      view.polyline(ctx, arc(goalLine, corner * HALF_W, 1, inward - Math.PI / 4, inward + Math.PI / 4, 6))
    }
  }
  ctx.stroke()

  // Goals: posts, bar and a faint net box.
  for (const side of [-1, 1]) {
    const x = side * HALF_L
    const back = x + side * 2
    ctx.strokeStyle = tint(palette.text, palette.isLight ? 0.55 : 0.75)
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    view.polyline(ctx, [[x, 0, -3.66], [x, 2.44, -3.66], [x, 2.44, 3.66], [x, 0, 3.66]])
    ctx.stroke()
    ctx.strokeStyle = tint(palette.text, 0.18)
    ctx.lineWidth = 1 * dpr
    ctx.beginPath()
    view.polyline(ctx, [[x, 2.44, -3.66], [back, 2, -3.66], [back, 0, -3.66]])
    view.polyline(ctx, [[x, 2.44, 3.66], [back, 2, 3.66], [back, 0, 3.66]])
    view.segment(ctx, [back, 2, -3.66], [back, 2, 3.66])
    ctx.stroke()
  }

  // Ball Knowledge reading the options: best two lanes from a blue carrier.
  const carrierIndex = sim.carrierIndex
  if (carrierIndex !== null && sim.players[carrierIndex].team === 'blue') {
    const carrier = sim.players[carrierIndex]
    ctx.setLineDash([4 * dpr, 7 * dpr])
    ctx.lineDashOffset = -draw.time * 24 * dpr
    ctx.lineWidth = 1.3 * dpr
    sim.options(carrierIndex).slice(0, 2).forEach((option, rank) => {
      const target = sim.players[option.index]
      ctx.strokeStyle = tint(palette.primaryBright, rank === 0 ? 0.55 : 0.3)
      ctx.beginPath()
      view.segment(ctx, [carrier.pos.x, 0.05, carrier.pos.z], [target.pos.x, 0.05, target.pos.z])
      ctx.stroke()
    })
    ctx.setLineDash([])
  }

  // Ball in flight: the pass path and its landing ring.
  if (sim.state.kind === 'flight') {
    const flight = sim.state
    const color = flight.team === 'blue' ? palette.primary : palette.green
    ctx.strokeStyle = tint(color, 0.7)
    ctx.lineWidth = 1.6 * dpr
    ctx.setLineDash([8 * dpr, 6 * dpr])
    ctx.beginPath()
    view.segment(ctx, [flight.from.x, 0.05, flight.from.z], [flight.to.x, 0.05, flight.to.z])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    view.polyline(ctx, ring(flight.to.x, flight.to.z, 1.2, 24))
    ctx.stroke()
  }

  // Pressure on the carrier.
  if (carrierIndex !== null && sim.pressureLevel > 0.15) {
    const carrier = sim.players[carrierIndex]
    ctx.strokeStyle = tint(palette.amber, 0.25 + sim.pressureLevel * 0.55)
    ctx.lineWidth = 1.6 * dpr
    ctx.beginPath()
    view.polyline(ctx, ring(carrier.pos.x, carrier.pos.z, 3 - sim.pressureLevel, 32))
    ctx.stroke()
  }

  // Click ripples and the hover marker.
  sim.ripples.forEach((ripple) => {
    const progress = ripple.t / 1.2
    ctx.strokeStyle = tint(palette.accent, 0.8 * (1 - progress))
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    view.polyline(ctx, ring(ripple.x, ripple.z, 0.8 + progress * 5, 32))
    ctx.stroke()
  })
  if (draw.hover) {
    ctx.strokeStyle = tint(palette.accent, 0.45)
    ctx.lineWidth = 1.2 * dpr
    ctx.beginPath()
    view.polyline(ctx, ring(draw.hover.x, draw.hover.z, 1.4, 28))
    ctx.stroke()
  }

  // Players and ball, back to front.
  type Sprite = { depth: number; paint: () => void }
  const sprites: Sprite[] = []

  sim.players.forEach((player, index) => {
    const body = view.project(player.pos.x, 0.95, player.pos.z)
    const foot = view.project(player.pos.x, 0, player.pos.z)
    if (!body || !foot) return
    const color = player.team === 'blue' ? palette.primary : palette.green
    const isCarrier = index === carrierIndex
    const isHovered = index === draw.hoveredPlayer
    const radius = Math.max(2.5 * dpr, body.scale * 0.55)

    sprites.push({
      depth: body.depth,
      paint: () => {
        ctx.fillStyle = tint(palette.bg, palette.isLight ? 0.18 : 0.5)
        ctx.beginPath()
        ctx.ellipse(foot.x, foot.y, radius * 1.1, radius * 0.38, 0, 0, Math.PI * 2)
        ctx.fill()

        const glow = ctx.createRadialGradient(body.x, body.y, 0, body.x, body.y, radius * 2.8)
        glow.addColorStop(0, tint(color, isCarrier || isHovered ? 0.5 : 0.28))
        glow.addColorStop(1, tint(color, 0))
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(body.x, body.y, radius * 2.8, 0, Math.PI * 2)
        ctx.fill()

        const fill = ctx.createRadialGradient(body.x - radius * 0.35, body.y - radius * 0.35, radius * 0.1, body.x, body.y, radius)
        fill.addColorStop(0, palette.isLight ? tint(palette.surface, 0.95) : tint(palette.text, 0.9))
        fill.addColorStop(0.35, color)
        fill.addColorStop(1, color)
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(body.x, body.y, radius, 0, Math.PI * 2)
        ctx.fill()

        if (isCarrier || isHovered) {
          ctx.strokeStyle = tint(palette.text, 0.9)
          ctx.lineWidth = 1.5 * dpr
          ctx.stroke()
          const label = player.role
          ctx.font = `800 ${11 * dpr}px ${palette.font}`
          ctx.textAlign = 'center'
          ctx.fillStyle = tint(color, 1)
          ctx.fillText(label, body.x, body.y - radius - 8 * dpr)
        }
      },
    })
  })

  const ballPoint = view.project(sim.ball.x, sim.ball.y + 0.22, sim.ball.z)
  const ballShadow = view.project(sim.ball.x, 0, sim.ball.z)
  if (ballPoint && ballShadow) {
    sprites.push({
      depth: ballPoint.depth - 0.5,
      paint: () => {
        const radius = Math.max(2.4 * dpr, ballPoint.scale * 0.24)
        ctx.fillStyle = tint(palette.bg, 0.45)
        ctx.beginPath()
        ctx.ellipse(ballShadow.x, ballShadow.y, radius * 1.2, radius * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = palette.isLight ? tint(palette.surface, 1) : tint(palette.text, 1)
        ctx.strokeStyle = palette.accent
        ctx.lineWidth = 1.4 * dpr
        ctx.shadowColor = tint(palette.accent, 0.8)
        ctx.shadowBlur = 12 * dpr
        ctx.beginPath()
        ctx.arc(ballPoint.x, ballPoint.y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.shadowBlur = 0
      },
    })
  }

  sprites.sort((a, b) => b.depth - a.depth).forEach((sprite) => sprite.paint())
}

export function nearestPlayer(sim: MatchSim, point: Vec, within = 2.6) {
  let best: number | null = null
  let bestDistance = within
  sim.players.forEach((player, index) => {
    const distance = dist(player.pos, point)
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return best as number | null
}
