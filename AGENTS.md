# Architecture rules
- Keep the staff live-order workspace at a separate owner-protected route from the records dashboard so operational tickets remain uncluttered.
- Load live tickets with a joined orders/items query and invalidate it from effect-scoped Realtime subscriptions plus polling so concurrent order and item changes converge safely.
- Update live order statuses with a compare-and-set against the current status so simultaneous staff actions cannot silently overwrite each other.
- Keep live queue ordering and status progression in a pure utility with tests so multiple incoming tickets follow a deterministic workflow.
- Await restored account details before completing authentication loading so direct protected-page visits do not redirect signed-in staff prematurely.