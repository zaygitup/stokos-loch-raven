# QA Results — Go-Live (TEST mode)

**Date:** 2026-06-18  
**Commit:** `6f78240`  
**Environment:** local (localhost:3000) + production URL (blocked)

---

## Automated smoke

| Environment | Command | Result |
|-------------|---------|--------|
| Local | `npm run smoke:test` | **8/8 PASS** (200/307) |
| Production | `SMOKE_BASE_URL=https://stokos-loch-raven-git-main-bayentlabs.vercel.app npm run smoke:test` | **8/8 PASS** but all **401** — Deployment Protection ON |

---

## Local functional checks (automated)

| Check | Result |
|-------|--------|
| Menu API `/api/store/towson/menu` | 200 — 7 products, 25 categories |
| Promo codes seeded | `STOKOS10`, `WELCOME5` |
| MongoDB indexes | Verified via `scripts/mongodb-indexes.js` |
| Build | Passes (`npm run build`) |

---

## Manual QA — local (ready to run)

Use [qa-checklist.md](./qa-checklist.md) on `http://localhost:3000`:

- [ ] Add items with modifiers → cart
- [ ] Pickup / delivery flow
- [ ] Checkout `4242 4242 4242 4242`
- [ ] Webhook → admin order Confirmed/Paid
- [ ] `/track?orderNumber=STK-...`
- [ ] Admin status advance + cancel
- [ ] Sign in → `/account/orders` → reorder
- [ ] Promo `STOKOS10` in cart

---

## Manual QA — production (blocked)

**Blocked until:** Vercel Deployment Protection OFF + env vars set per [go-live-handoff.md](./go-live-handoff.md)

Repeat full [qa-checklist.md](./qa-checklist.md) on bayentlabs URL after unblock.

---

## Live $1 test

**Pending:** Stokos Stripe bank onboarding + LIVE keys ([go-live-handoff.md](./go-live-handoff.md) Phase 6)
