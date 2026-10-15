---
version: 1
slug: "src-pages-home-jsx"
primary_target: "src/pages/Home.jsx"
related_targets: []
---

# Surface: storefront home (/)

Mode: Persuade. Audience: Saudi starters and existing Salla merchants, mostly mobile, arriving from ads/WhatsApp. Action: pick a service and add it to cart, or open the full catalog. Proof: published Salla reviews, real prices, real lead time (store design 2–6 days); portfolio images and real numbers pending from Raed. Constraints: brand colors/logo/plain Arabic font fixed; Tailwind + shadcn primitives; RTL.

## Direction contract
seed: c777a116 (degraded roll, assigned candidate 6, user had no preference)

THESIS: A store is something you can track. The page reads like a shipment waybill for your business — from paperwork to first order — instead of the category-default banner + product-card grid.

OWN-WORLD: Cream paper ground, forest-green ink, gold used only as the stamp/seal and the "current stop". Ticket/receipt cards with perforated notched edges, thin rule dividers, tabular numerals, status chips, a vertical/horizontal tracking line with stops. Readex Pro display, Almarai text.

STORY: 1) see the whole route at once with real prices per stop; 2) pick a stop, see its services; 3) proof (reviews, delivered stores); 4) price list; 5) FAQ; 6) WhatsApp close.

FIRST VIEWPORT: Left/right split — headline + primary CTA, and a live "waybill" card: tracking number, four stops (وثّق / جهّز / فعّل / سوّق) with a gold stamp on the active stop and the cheapest real price per stop. Mobile: headline, CTA, then the waybill card stacked.

SIGNATURE: Tapping a stop advances the tracking line (animated fill + stamp) and swaps the services list below — the same tracker later powers the customer order page.

RISK: Logistics vocabulary could read cold; keep it warm with Saudi copy and real reviews, and never fake tracking numbers as real orders (label as example).
