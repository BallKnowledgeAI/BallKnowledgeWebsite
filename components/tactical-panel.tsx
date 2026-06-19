'use client'

import { useState } from 'react'

const players = [
  { id: 'a', x: 12, y: 50, team: 'blue' },
  { id: 'b', x: 32, y: 25, team: 'blue' },
  { id: 'c', x: 35, y: 72, team: 'blue' },
  { id: 'd', x: 57, y: 48, team: 'blue' },
  { id: 'e', x: 73, y: 23, team: 'green' },
  { id: 'f', x: 76, y: 70, team: 'green' },
  { id: 'g', x: 91, y: 49, team: 'green' },
]

const links = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['c', 'd'],
  ['d', 'e'],
  ['d', 'f'],
  ['e', 'g'],
  ['f', 'g'],
]

export function TacticalPanel() {
  const [selected, setSelected] = useState('d')

  const playerById = Object.fromEntries(players.map((player) => [player.id, player]))

  return (
    <div className="tactical-panel" aria-label="Interactive tactical passing network">
      <div className="pitch-lines" />
      <div className="pressure-zone zone-one" />
      <div className="pressure-zone zone-two" />
      <div className="scan-beam" />
      <div className="analysis-readout">
        <span>LIVE MODEL</span>
        <strong>{selected === 'd' ? 'Progressive outlet identified' : 'Passing lane selected'}</strong>
      </div>
      <svg viewBox="0 0 100 100" role="img" aria-label="Passing network">
        {links.map(([from, to]) => {
          const start = playerById[from]
          const end = playerById[to]
          const active = from === selected || to === selected
          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className={active ? 'active-link' : ''}
            />
          )
        })}
        {players.map((player) => (
          <circle
            key={player.id}
            cx={player.x}
            cy={player.y}
            r={selected === player.id ? 3.2 : 2.2}
            className={`${player.team} ${selected === player.id ? 'selected' : ''}`}
            onClick={() => setSelected(player.id)}
            tabIndex={0}
            role="button"
            aria-label={`Select player ${player.id.toUpperCase()}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setSelected(player.id)
            }}
          />
        ))}
      </svg>
      <div className="panel-metrics">
        <span><strong>82%</strong> lane confidence</span>
        <span><strong>3.4s</strong> sequence window</span>
        <span><strong>+0.18</strong> threat gain</span>
      </div>
    </div>
  )
}
