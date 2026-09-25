# Desktop page override

## Direction

- Style: clean enterprise UI; white canvas, quiet neutral borders, stable grid.
- Brand: deep GG Power green for actions and icons; avoid large tinted surfaces.
- Typography: the existing Frappe/system sans-serif throughout, including the desktop heading, for reliable Vietnamese rendering.
- Icons: one consistent outline SVG family from Frappe's bundled Lucide set.
- Motion: color, border and shadow transitions only; no scale-based hover.

## Layout

- Keep the native Frappe Desktop behavior and six-column desktop grid.
- Add a compact, unornamented heading above applications to reduce the empty visual field.
- Use four columns below 1024px, three below 720px, and two below 480px.
- Keep VI/EN visible beside the user controls on Desktop and in the page action header elsewhere.

## Accessibility

- Minimum 44px interactive width for the language switch.
- Visible focus rings on search, module cards and language switch.
- Preserve native semantic links and buttons; do not replace application icons with emoji.
- Respect `prefers-reduced-motion`.
