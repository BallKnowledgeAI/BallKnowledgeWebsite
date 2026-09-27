# Ball Knowledge — Frontend Design System

One reference for how styling works across every Ball Knowledge frontend — the marketing site (`/`, `/about`, `/features`, `/contact`) and standalone modules like **Press & Intensity**. It's split in two:

- **Part A — Portable brand core.** Tokens, typography, shape, and motion rules that are framework-agnostic and should be identical in every module, regardless of stack (Next.js, Vite, whatever comes next).
- **Part B — This repo's implementation.** How the ballknowledge.ai marketing site specifically wires Part A together (file layout, layout shell, page classes, known issues). Only relevant if you're working in *this* repo.

If you're building or aligning a different module, read Part A, copy [`design-system/tokens.css`](design-system/tokens.css) into it, then skip to §11.

---

## Part A — Portable brand core

### 1. Design tokens

[`design-system/tokens.css`](design-system/tokens.css) is the canonical token file — copy it into any module and import it before your own styles. It defines a dark-default `:root` block plus a `:root[data-theme="light"]` override, following the same shape as the marketing site's tokens:

```css
/* Surfaces */
--bg, --surface, --elevated, --card

/* Brand blue */
--primary, --primary-bright, --primary-glow, --primary-dim, --deep, --deep-glow, --accent

/* Pitch green — secondary brand color, "live / positive / success" */
--green, --green-dim

/* Status tones */
--amber, --amber-dim   /* warning / medium-risk */
--danger, --danger-dim /* error / high-risk */

/* Text */
--text, --text-soft, --muted

/* Borders */
--border, --border-strong

/* Tactical-pitch motif */
--pitch-line, --pitch-fill

/* Shape */
--radius-sm (8px), --radius (12px), --radius-lg (16px), --radius-xl (24px), --pill (999px)

/* Motion */
--ease            /* micro-interactions: hover, focus, toggles */
--reveal-duration, --reveal-ease   /* entrance/reveal animations */
```

Never hardcode a hex/rgb color, radius, or easing curve in a component — reference the token. This is what makes theming and future rebrands a one-file change.

**Theme mechanism:** dark is the default token set; `:root[data-theme="light"]` swaps the values. Toggle by setting `data-theme="light"|"dark"` on the root element and persisting the choice (the marketing site uses `localStorage['bk-theme']`; use the same key if the module should share theme preference with the main site in future). Add a `theme-switching` class to the root for one animation frame during the swap to avoid a flash of animated color-fade — `tokens.css` already includes the CSS for this, you just need to toggle the class in JS.

**Glass/depth surfaces:** panels don't use a flat `--surface` fill. The pattern is `color-mix(in srgb, var(--surface) NN%, transparent)` (or the pre-mixed `--card` token) + `backdrop-filter: blur(Npx)`. Reuse this instead of inventing new translucency values.

A module that's dark-only (e.g. an internal ops dashboard) can skip the light override block entirely — just don't invent new dark values that drift from the canonical ones above.

### 2. Typography

Two fonts, no others:
- **Barlow Condensed** (weights 700/900) — all display headings, big numbers, hero titles. Always `text-transform: uppercase`, tight `line-height` (0.86–0.95), and a `text-shadow` glow using `--primary-glow`.
- **DM Sans** — everything else: body copy, labels, buttons, nav, form fields, data readouts.

Load via `next/font/google` in a Next.js app, or a `<link>`/`@import` of Google Fonts in anything else — either is fine as long as the family names and weights match. Heading sizes use `clamp()` rather than fixed breakpoints, e.g. `clamp(56px, 9vw, 108px)` for page-level h1s, `clamp(34px, 5vw, 58px)` for section h2s.

### 3. Shape & elevation language

- Radius scale: `--radius-sm` (8px, small controls) / `--radius` (12px, inputs/chart cards) / `--radius-lg` (16px, panels) / `--radius-xl` (24px, hero/CTA-scale surfaces) / `--pill` (999px — nav links, tags, buttons, badges).
- Borders are always `1px solid var(--border)`, tinted stronger via `--border-strong` or `color-mix(in srgb, var(--primary) N%, transparent)` on hover/focus/active.
- Shadows follow one formula: `0 Npx Mpx color-mix(in srgb, var(--bg) NN%, transparent)` for drop shadow, plus an `inset 0 0 Npx color-mix(in srgb, var(--primary) N%, transparent)` for the "glow from within" effect on hero/panel surfaces.
- Hover motion is consistently `translateY(-2px to -7px)` plus either `filter: brightness(1.1)` or a border/shadow color shift — never a scale-only hover.

### 4. Motion

- All micro-interactions (hover, focus, toggles) use `--ease` (`160ms cubic-bezier(0.16, 1, 0.3, 1)`); entrance/reveal animations use the same curve at `--reveal-duration` (700ms) via `--reveal-ease`. Don't introduce a different easing curve.
- Looping ambient animations (pulsing "live" dots, drifting particles, scanning beams, breathing glows) are welcome and part of the brand's identity — but **every** module must include a `prefers-reduced-motion: reduce` media query that disables/shortens them. Copy the pattern from `app/globals.css` (search `prefers-reduced-motion`).
- Status pulses: a small circle with `box-shadow` glow + a `scale`/`opacity` keyframe is the established "live" indicator pattern (`.badge-indicator` on the marketing site, `.live-dot` in Press & Intensity) — reuse this shape rather than a spinner or a different pulse style.

### 5. Naming conventions

- Shared, cross-page/cross-module classes get no prefix (`.feature-grid`, `.chart-card`).
- Page- or module-unique classes are prefixed with that page/module's name (`about-*` on the marketing site, `press-*`/`canvas-*` in Press & Intensity). This keeps one module's one-off visual language from leaking into or colliding with another's.
- Status/tone utility classes follow `.tone-{name}` (e.g. `.tone-green`, `.tone-amber`, `.tone-blue`) mapping directly to a token — already the pattern in Press & Intensity, worth adopting on the marketing site too if it ever needs inline status coloring.

---

## Part B — This repo's implementation (ballknowledge.ai marketing site)

### 6. Where styles actually live

| File | Status | Purpose |
|---|---|---|
| `app/globals.css` | **Active — the real design system** | All design tokens, resets, shared layout classes, and every page's component styles. ~2,930 lines, imported once in `app/layout.tsx`. Tokens here are the ones mirrored into `design-system/tokens.css`. |
| `tailwind.config.js` | **Stale, not used by any page** | Defines a `light`/`dark` color palette (`rgb(...)` values) that doesn't match the tokens in `app/globals.css` and isn't referenced by any `className`. |
| `styles/globals.css` | **Dead file, not imported anywhere** | Leftover shadcn/Tailwind-v4 boilerplate (`oklch` tokens, `@theme inline`) from the original v0.app scaffold. |
| `components/ui/*` (~50 files) | **Dead code, not imported anywhere** | Full shadcn/ui component set generated by the scaffold. No page imports from `@/components/ui/*`. |

Treat `app/globals.css` as the single source of truth for this repo. The other three are candidates for deletion — see §9.

### 7. Layout shell

`components/site-shell.tsx` (`<SiteShell>`) is the intended wrapper for every page: fixed `.site-header` (logo, nav, theme toggle, mobile menu), tactical pitch-motif background (`.tactical-backdrop`, `.pitch-grid`, `.field-node`, `.field-path`), `.site-main` content well, `.site-footer`.

- `/about`, `/features`, `/contact` all use `<SiteShell currentPath="...">{children}</SiteShell>` — the correct pattern for a new page in this repo.
- **`/` (`app/page.tsx`) does not use `SiteShell`.** It hand-rolls its own header, background gradients, and footer with inline `style={{...}}` objects, and duplicates the theme-toggle logic locally. This is the single biggest cohesion gap in this repo — see §9.

Shared shell classes: `.site-shell`, `.site-header`, `.site-brand`, `.site-nav` / `.site-nav a` (`.active` state), `.site-actions`, `.icon-control` (circular theme/menu buttons), `.site-main`, `.site-footer`.

### 8. Page building blocks

- **`.product-hero`** — centered hero: kicker (`.section-kicker`, pill-shaped) → `h1` with an `<em>` highlight word → `p` → `.hero-tags` (pill chips) → optional `.hero-signal` decorative panel.
- **`.section-heading`** — centered eyebrow + `h2` + `p`, used to introduce every content section (`.feature-section`, `.analysis-section`, `.workflow-section`).
- **`.feature-grid` / `.feature-item`** — responsive card grid (4 → 2 → 1 columns), each item has `.feature-icon`, a kicker `span`, `h3`, `p`, and a `.feature-scanline` hover accent. Even-indexed items swap to `--green` accents via `:nth-child(even)`.
- **`.tactical-panel`** (`components/tactical-panel.tsx`) — interactive "passing network" visualization over `.pitch-lines`, with `.analysis-readout` and `.panel-metrics` overlays.
- **`.workflow-track`** — 4-step numbered process row (`.workflow-index`, icon, `h3`, `p`), connected by a dashed line.
- **`.product-cta`** — full-width closing banner with `.cta-actions` (`.primary-link` / `.secondary-link` pill buttons).
- **Contact-specific:** `.contact-layout`, `.contact-channel`, `.contact-trust`, `.contact-socials`, `.contact-form` (+ `.contact-submit`, `.contact-feedback.success/.error`).
- **About-specific:** everything prefixed `about-*` — page-unique scenes, per §5's naming convention.

### 9. Known inconsistencies worth cleaning up

1. **Homepage bypasses the shared shell.** `app/page.tsx` reimplements header/nav/theme-toggle/footer inline instead of `<SiteShell>`. Recommend migrating `/` onto `<SiteShell>` and extracting its inline styles into named classes.
2. **Dead files:** `styles/globals.css`, `tailwind.config.js`'s color palette, and `components/ui/*` are unused and risk misleading future edits. Recommend deleting them (or wiring `tailwind.config.js` to the real tokens if Tailwind utilities are ever adopted).
3. **`app/globals.css` has grown by accretion** — several "polish pass" blocks near the bottom restyle selectors already styled earlier in the file. It works (later rules win) but makes the source hard to read top-to-bottom. Search for **all** occurrences of a selector before editing it.

### 10. Checklist for a new page in this repo

1. Wrap the page in `<SiteShell currentPath="/your-path">` and add the route to `navItems` in `components/site-shell.tsx`.
2. Compose from §8's existing section classes before inventing new ones.
3. Any color/radius/shadow should reference a token or match the §3 formulas.
4. Prefix page-only classes with the page name (`yourpage-*`).
5. Barlow Condensed + uppercase for headings, DM Sans for everything else.
6. Add any new looping animation's selector to the `prefers-reduced-motion` block.
7. Check both themes before shipping.

---

## Part A applied — other Ball Knowledge modules

### 11. Press & Intensity (`D:\Press&Intensity\press_and_intensity\frontend`)

A standalone Vite + React dashboard (live match press/intensity telemetry), not part of this Next.js repo, styled by its own `src/styles.css`. It was clearly built to the same brand — most tokens already match the marketing site exactly (`--primary: #3BA7F0`, `--deep: #1F3C88`, `--green: #2ECC71`, `--text: #F0F6FF`, `--border: rgba(59,167,240,0.14)`, and even the same `cubic-bezier(0.16, 1, 0.3, 1)` easing curve). A copy of the doc and canonical tokens now lives in that repo too (`DESIGN_SYSTEM.md`, `src/brand-tokens.css`).

**Alignment status** (current `styles.css` vs. the canonical tokens in §1):

| Canonical token | Press & Intensity today | Status |
|---|---|---|
| `--primary`, `--primary-bright`, `--deep`, `--green`, `--text`, `--border` | Exact match | ✅ |
| `--bg` | `#050810` vs. canonical `#04080F` | Close but not identical |
| `--surface` | `rgba(9,14,26,0.86)` flat, vs. canonical `#0A1020` + `color-mix()` for translucency | Different mechanism, similar result |
| `--muted` | `#8A94A6` vs. canonical `#8A9AB5` | Close but not identical |
| `--card`, `--border-strong`, `--text-soft`, `--amber` | Already exists in P&I's `styles.css` | These are the tokens the canonical set adopted *from* Press & Intensity — no change needed there |
| Light theme | Dark-only (`color-scheme: dark` hardcoded) | No light theme yet — fine for an ops dashboard, but if one's ever wanted, `tokens.css`'s `:root[data-theme="light"]` block is ready to drop in |

**To fully align it:** in `press_and_intensity/frontend/src/styles.css`, replace the hand-written `:root { ... }` block (lines 3–27) with `@import "./brand-tokens.css";`, then fix the ~3 exact-value mismatches above. This wasn't done as part of this change since it edits a separately-running app's visual output — flag it to whoever owns that repo, or ask to have it applied directly.

### 12. Adding a new module

1. Copy `design-system/tokens.css` into the new module and import it first, before any component styles.
2. Follow §2–§5 (typography, shape, motion, naming) as-is — they're stack-agnostic.
3. If the module needs a token the canonical set doesn't have yet, add it to `design-system/tokens.css` (with a light-theme value if you can derive one) rather than inventing a local one-off — that keeps the next module in sync too.
4. List the new module in §11 above so this doc stays the map of everything that should look like Ball Knowledge.
