# Desktop page override

## Direction

- Style: clean enterprise UI with a branded watercolor hero, white canvas, quiet neutral borders and stable grid.
- Brand: use the supplied GG Power campus artwork and official logo without changing their proportions; deep green for actions and orange only as an accent.
- Typography: the existing Frappe/system sans-serif throughout, including the desktop heading, for reliable Vietnamese rendering.
- Icons: one consistent outline SVG family from Frappe's bundled Lucide set.
- Motion: color, border and shadow transitions only; no scale-based hover.

## Layout

- Preserve the native Frappe Desktop links and behavior inside redesigned application cards.
- Use a two-part hero: readable copy on the left and the supplied campus artwork on the right.
- Use a four-column application grid on wide screens, three below 1180px, two below 900px and one below 640px.
- Each application card contains its native link, a Lucide icon, title, concise scope description and navigation affordance.
- Keep VI/EN visible beside the user controls on Desktop and in the page action header elsewhere.

## Accessibility

- Minimum 44px interactive width for the language switch.
- Visible focus rings on search, module cards and language switch.
- Preserve native semantic links and buttons; do not replace application icons with emoji.
- Respect `prefers-reduced-motion`.
