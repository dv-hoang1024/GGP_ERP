# Manufacturing dashboard override

## Direction

- Style: dense, clean operational dashboard based on the supplied production reference.
- Data: show only live ERPNext data available to the signed-in user; never render illustrative KPI values.
- Color: GG Power green for primary actions and progress, orange/blue/purple only for categorical accents.
- Typography: existing Frappe/Inter system stack for reliable Vietnamese rendering.

## Layout

- Full available workspace width beside the native Manufacturing sidebar.
- Header with title, last refresh time and three primary operational actions.
- Five KPI cards followed by production output, operation progress, recent work orders, shortcuts, alerts, and master-data links.
- Collapse primary grids to one column on narrower screens and keep data tables horizontally scrollable.

## Interaction and accessibility

- Keep all existing ERPNext routes and permissions; links use native `frappe.set_route`/`frappe.new_doc` behavior.
- Use real buttons for actions, visible focus states, text labels beside icons and keyboard access for table rows.
- Preserve empty states when a user lacks data or permissions.
- Respect `prefers-reduced-motion` and avoid layout-shifting hover effects.
