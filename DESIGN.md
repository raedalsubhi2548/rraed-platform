# Raed design system — the night route

Source of truth for values: `src/styles/tokens.css` (primitive → semantic → component → world). Tailwind v4 reads the semantic layer through `@theme inline`, so utilities resolve where they are used; that is what lets a `.night` region re-theme everything inside it.

## World
A store is a journey from zero to first order. One silver route runs the home page; every service sits on its stage with its real price. Midnight navy grounds, polished silver only on hairlines, nodes, numerals and the primary pill. Reading and buying pages (shop, product, cart, checkout, account) are porcelain with navy ink; the footer always settles into the night.

Brand is pinned by the owner (Oct 2026): navy + silver, the Raed logo. The store designer palettes still work: the night tokens are mixed from the brand primitives.

## Tokens (world layer)
| Token | Role |
|---|---|
| `--night-0 … --night-4` | grounds, deepest to raised panel (mixed from `--p-green-950/900/800`) |
| `--silver-hi`, `--silver`, `--silver-lo` | silver ink: pill + numerals, accent text, quiet rules |
| `--ink-night`, `--muted-night`, `--line-night` | text, secondary text, hairlines on night |
| `--rim`, `--rim-day` | 1px polished-silver border gradients (night / porcelain) |
| `--shadow-plate`, `--shadow-plate-day` | offset soft shadows for plates |

`.night` re-points the semantic layer (`--background`, `--foreground`, `--primary`, `--surface`, `--border`…) and the component knobs (`--btn-*`, `--ticket-*`, `--chip-*`), so buttons, accordions and fields render silver-on-midnight with no dark variants of their own. The home page shell (header, page, footer) gets `.night` from `Layout.jsx`; `html.night-root` themes the overscroll and scrollbar.

## Type
- Display: **Readex Pro** 300/400/500 (self-hosted, `src/fonts.css`), light at large sizes: hero 2.6–4.4rem, section 2–2.8rem, stage 1.8–2.1rem. Never bold.
- Text: **IBM Plex Sans Arabic** 300–700, body 15.5px / 1.8.
- Prices are tabular, Readex light. No eyebrows or kickers above headings.

## Components
- `.rim` — a 1px silver rim drawn on the element's own corners; on hover/focus a point of light runs around it (`@property --sweep`).
- `.plate` — the panel material: night gradient inside `.night`, white on porcelain. `--plate-end` is the colour images fade into.
- `ServiceTicket` — the service plate: image melting into the plate, real Salla rating when one exists, name, one-line summary, silver price, round add button.
- `RoutePanel` (Home) — four stages from `src/lib/route.js`, each with its lowest real price (per-unit add-ons excluded); auto-advances until touched, then follows the visitor.
- `Station` (Home) — a category products block drawn as a numbered stage: sticky stage head on the start side, plates two per row.
- Admin: night sidebar, rim plates for panels/tables/KPIs, «مسار الطلبات» shows orders on the same route (pending → completed), the stops with work waiting glow.

## Motion
One authored moment per surface: the light that runs the hero route (`route-run`), the page-long route glow tied to scroll (`route-follow`, scroll-driven), and the rim sweep on hover. Content is visible by default; nothing waits for an observer to appear. Everything respects `prefers-reduced-motion`.

## Rules
- RTL first: logical utilities only. 44px touch targets. WCAG AA on night and porcelain.
- Never invent prices, numbers, reviews or claims; stages read the live catalog.
