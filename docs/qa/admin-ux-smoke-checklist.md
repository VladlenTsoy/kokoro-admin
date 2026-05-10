# Kokoro Admin UX Smoke Checklist

Use this checklist before merging admin UI changes that affect manager workflows. It is intentionally manual and lightweight so it can run without production data, secrets, or service restarts.

## Scope

- Primary surfaces: Today Order Desk (`/orders`), Clients CRM (`/clients`), product/catalog settings, login/recovery states.
- Viewports: desktop (`1440px`), tablet (`768px`), mobile (`390px`).
- Data states: loading, populated, filtered empty, API error where mock/dev tooling allows.

## Manager workflow checks

### Today Order Desk

- [ ] Table shows the next operational action without requiring the manager to open every order.
- [ ] Payment, delivery, risky-cancel/refund, and SLA/status badges are understandable to a Russian-speaking manager.
- [ ] Filters visibly explain the current narrowed context and can be reset quickly.
- [ ] Empty state distinguishes “no orders today” from “filters hide all orders”.
- [ ] Drawer keeps phone, address, payment, delivery, assignee, comments, and history readable on desktop/tablet/mobile.
- [ ] Status/cancel/comment modals explain whether the action is visible to the customer and what follow-up is expected.

### Clients CRM

- [ ] Search copy states what can be searched: name, phone, order/client identifier if supported.
- [ ] Zero-result state gives a safe next step: clear search, check phone format, or create/support follow-up.
- [ ] Client rows expose status, orders count, total spent, and primary action without horizontal confusion.
- [ ] Client drawer tabs have useful empty states for orders, addresses, and bonuses.
- [ ] Nested drawer tables scroll safely on mobile instead of clipping actions/statuses.

### Catalog and settings forms

- [ ] Required fields, disabled controls, and permission-limited actions explain why the manager cannot proceed.
- [ ] Delete/archive confirmations name the affected entity and describe operational impact.
- [ ] Dense tables have mobile horizontal scroll and avoid raw technical enum values.
- [ ] Loading and error states tell the manager whether retrying is safe.

## Accessibility and responsive checks

- [ ] Icon-only controls have accessible labels or text equivalents.
- [ ] Keyboard focus is visible for filters, primary actions, table row actions, drawers, and modals.
- [ ] Mobile layouts keep primary actions reachable without cramped wrapping.
- [ ] Copyable values such as phone/order numbers are still available on narrow screens.

## Regression note format

For each checked change, record:

```text
Surface:
Viewport(s):
Data state(s):
Result: pass / issue
Evidence: screenshot, short video, or exact steps
Follow-up backlog item:
```
