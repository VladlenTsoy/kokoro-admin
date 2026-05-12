# Admin UX/UI smoke checklist

Use this checklist before accepting manager-facing changes in `kokoro-admin`. It is intentionally safe: no production data changes, no destructive actions, and no direct database access.

## Scope

Cover the surfaces managers use during an operational shift:

- Today Order Desk (`/orders`): filters, status/payment/delivery badges, drawer, row actions, handoff flows.
- Clients CRM (`/clients`): search, profile drawer, order history, contacts, empty/error states.
- Catalog (`/products`, `/products/:id`): product list, editor sections, images, prices, stock, publication controls.
- Settings dictionaries (`/settings/*`): tables, create/edit modals, delete confirmations, filters, integration/payment guidance.
- Access management (`/admin/*` or staff/roles routes): permissions, disabled actions, role/employee forms.
- Navigation recovery: login, logout, 403, 404, header notifications, mobile menu.

## Required viewport pass

Run each changed flow in at least these sizes:

- Mobile: 390 × 844
- Tablet: 768 × 1024
- Desktop: 1440 × 900

Check that primary actions stay visible, row actions wrap instead of overflowing, drawers/modals remain readable, and tables have usable horizontal scroll when needed.

## Universal UX states

For every changed table, form, drawer, modal, or card, verify:

- Loading state: no blank screen; copy explains what is loading when the wait is visible.
- Empty state: explains why there is no data and offers a safe next action or reset.
- Filtered empty state: shows active filters/search and has a clear reset path.
- Error state: gives a retry action and tells the manager what is safe to do next.
- Disabled/no-permission state: makes unavailable actions understandable without exposing secrets.
- Success state: create/edit/delete/copy actions give visible confirmation.
- Validation state: required fields and risky values have local, actionable messages.
- Destructive confirmation: delete/cancel/offboarding copy names the operational risk and has a safe cancel path.
- Visual hierarchy: next action, warning badges, totals, and status labels are scannable before secondary details.
- Russian copy: labels are manager-facing, not raw enum/API language, unless a code is intentionally shown.

## Today Order Desk smoke

- Open `/orders` with no filters; confirm table, status badges, payment/delivery labels, and next actions are readable.
- Apply status, payment, delivery, date, problem-only, and attention-only filters; verify chips/URL state/reset behavior.
- Search by order/client signal; confirm reset and filtered-empty recovery.
- Open an order drawer; verify next action, client, phone, address, payment, delivery, responsible employee, total, and history context.
- Use safe navigation actions: open client profile, open exact order link, copy handoff summary if present.
- Check risky order states: paid + cancelled, failed payment, missing phone/address, overdue new order.
- On mobile/tablet, verify drawer header actions and table row actions wrap without hiding primary controls.

## Clients CRM smoke

- Search by name/phone/ID; confirm filtered-empty reset.
- Open a client drawer; verify profile, orders, addresses, and bonus/history loading/error/empty states.
- Edit contact details; verify placeholders, validation, save/cancel loading, and success/error feedback.
- From client order history, open the exact order when link/action exists.
- On mobile, verify drawer width, contact rows, and actions remain tappable.

## Catalog and product editor smoke

- Product list: verify image/photo indicators, publication/stock/status labels, filters/search, and empty/error states.
- Product editor: check price/discount, images, variants, stock, tags, categories, publication/new-badge controls.
- Confirm incomplete states are understandable: no sizes, no photos, zero/low stock, inactive tags/statuses, missing price.
- Save validation: required fields show local messages; mutation failures are recoverable.
- On mobile, form sections stack cleanly and primary save actions are reachable.

## Settings dictionaries smoke

For each changed `/settings/*` page:

- Load, retry error, base empty, and filtered empty states.
- Search/filter counters and reset behavior.
- Create/edit modal labels, placeholders, validation hints, loading state, and success/error feedback.
- Delete confirmation copy, cancel path, and delete loading state.
- Any integration/payment/token fields: secrets stay masked or are described without revealing values.

## Access and recovery smoke

- Login: expired/manual logout/first-login messages, safe return path, and notice reset after successful login.
- Logout: confirmation cancel/confirm, save reminder visibility.
- 403: requested path, missing permission/action context if available, safe navigation actions.
- 404: requested path, dashboard/orders/catalog/back recovery actions.
- Staff/roles: no-role/inactive filters, disabled actions without permission, offboarding/delete warnings.

## Evidence to attach to a review/report

Record concise evidence for each changed flow:

- Branch and commit hash.
- Browser/viewport sizes checked.
- Data state used: populated, empty, filtered-empty, API error, no permission, mobile.
- Screenshots or short notes for changed visual states.
- Commands run: lint, build, typecheck, smoke script, or direct inspection.
- Known risks and rollback plan.

## Stop conditions

Stop and escalate before continuing if a change requires:

- Production deploy/restart or service lifecycle changes.
- Direct DB edits, migrations, or data deletion.
- Secret/token access or exposing raw env values.
- High-risk workflow changes such as refunds, bulk order updates, destructive catalog operations, or permission policy changes without owner approval.
