# Raed design system

Source of truth for values: `src/styles/tokens.css` (three layers). Tailwind v4 reads the semantic layer through `@theme inline`, so utilities like `bg-primary`, `text-accent-text`, `rounded-lg`, `shadow-card` always resolve to brand tokens.

## World
A store is something you can track. The storefront reads like a waybill for your business: cream paper, forest-green ink, gold only as the stamp and the "current stop". Ticket cards with notched edges and a perforated rule, tabular numerals, status chips, and one tracking line that runs from paperwork to first order. The same tracker powers the customer order page.

## Tokens
| Layer | Purpose | Examples |
|---|---|---|
| Primitive | raw values, never used in components | `--p-green-900 #09382e`, `--p-gold-400 #d7c676`, `--p-cream-50 #fefbf2`, `--p-gold-700` (gold text, AA on cream) |
| Semantic | intent | `--primary`, `--accent`, `--accent-text`, `--background`, `--surface`, `--surface-sunken`, `--border`, `--ring`, `--success/warning/danger` |
| Component | per-component knobs | `--btn-*`, `--ticket-*`, `--tracker-*`, `--chip-*`, `--header-height` |

Brand is fixed: green #09382e, gold #d7c676, cream #fefbf2, white #ffffff. Gold is never used for body text on cream; use `text-accent-text` (#6f6220).

## Type
- Font: **IBM Plex Sans Arabic** (300–700) for everything; headings at 600, never heavier. Plain, soft, modern; no decorative Kufi.
- Body 15.5px. Display sizes: 26 · 32 · 40 · 48 (`text-display-sm/md/lg/xl`).
- Body line-height 1.75 (Arabic needs air); headings 1.15–1.3. Prices use `tabular`.

## Space, radius, elevation
- 4px grid: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96. Sections: 64px mobile, 80–96px desktop.
- Radius: xs 6 (chips) · sm 10 · md 14 (controls inside cards) · lg 20 (cards, tickets) · xl 28 (panels, banners) · pill (buttons).
- Shadows are green-tinted, never grey: `shadow-hairline` (resting), `shadow-card` (raised), `shadow-overlay` (sheets, dialogs).

## Motion
- Durations: 120 fast · 200 base · 320 slow · 520 stage. Easing: standard `cubic-bezier(.2,.7,.2,1)`, emphasized `cubic-bezier(.16,1,.3,1)`.
- One orchestrated moment per page: the waybill fills stop by stop on first paint, and the gold stamp lands on the active stop.
- Motion answers actions (tracker advance, sheet open, accordion). No scroll-triggered fade-ups. Everything respects `prefers-reduced-motion`.

## Components (shadcn/ui, RTL)
- `ui/button` — primary (green), accent (gold), outline, ghost; 48/56px heights.
- `ui/badge` — green, gold, soft.
- `ui/sheet` — mobile menu and cart, opens from the start (right) edge.
- `ui/accordion`, `ui/tabs` — Radix, wrapped in `DirectionProvider dir="rtl"`.
- `home/Waybill` + `Ticket` + `Barcode` — the signature waybill and ticket shell.
- `home/ServiceTicket` — product card as a ticket stub.
- `site/SiteHeader`, `site/SiteFooter`, `site/SearchDialog`.

## Rules
- RTL first: logical utilities only (`ms-`, `pe-`, `start-`, `end-`).
- 44px minimum touch targets. WCAG AA contrast.
- Never invent prices, numbers, reviews, or facts. Missing content renders as a dashed «بانتظار المحتوى» block until Raed supplies it.
