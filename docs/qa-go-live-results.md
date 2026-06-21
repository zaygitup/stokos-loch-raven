# QA Results — Go-Live (TEST Public QA)

**Target:** Public Bayent Labs URL + Stripe TEST checkout  
**Sign-off:** PENDING — complete after Session 3

---

## Automated checks

| Check | Local | Production |
|-------|-------|------------|
| `npm run smoke:test` | PASS 8/8 (200) | FAIL — all 401 until Session 1 |
| `npm run check:session1` | N/A | FAIL — Deployment Protection ON |
| Build `npm run build` | PASS | — |
| MongoDB indexes | PASS (dev cluster) | PENDING (Abassi prod) |
| Promos seeded | PASS `STOKOS10`, `WELCOME5` | PENDING (prod URI) |

---

## Session sign-off

| Session | Criteria | Status | Date | Verified by |
|---------|----------|--------|------|-------------|
| 1 — Vercel public | `check:session1` → 200 | PENDING | | |
| 2 — Clerk admin | Sign-in on prod URL | PENDING | | |
| 3 — Full QA | [qa-checklist.md](./qa-checklist.md) all pass | PENDING | | |

---

## Manual QA — production ([qa-checklist.md](./qa-checklist.md))

Run on `https://stokos-loch-raven-git-main-bayentlabs.vercel.app` after Sessions 1–3.

### 4.1 Customer flow

- [ ] Menu loads: `/store/towson`, `/store/york`, `/store/liberty`
- [ ] Add items with modifiers, size, toppings, note
- [ ] Pickup vs delivery; delivery address required
- [ ] Minimum order enforced when configured
- [ ] Tax and delivery fee in cart/checkout
- [ ] Stripe Checkout `4242 4242 4242 4242`
- [ ] Success page shows order summary
- [ ] `/track` finds order by number

### 4.2 Payment + data

- [ ] Webhook → **Confirmed / Paid** within ~30s
- [ ] Order in `/admin/orders` with correct branch and amounts
- [ ] Abandoned checkout → **Awaiting Payment** in admin
- [ ] Connect transfer N/A for TEST QA (no Connect env)

### 4.3 Admin auth

- [ ] Allowed email → `/admin` loads
- [ ] Non-allowed email → unauthorized
- [ ] Signed out → redirect sign-in
- [ ] Footer Staff Login works

### 4.4 Admin operations

- [ ] Branch pills filter dashboard + orders
- [ ] Status advance: Placed → Confirmed → Preparing → Ready → Completed
- [ ] Cancel unpaid order
- [ ] Cancel paid order shows refund warning

### 4.5 Account + promos (added)

- [ ] Sign in → `/account/orders` → reorder
- [ ] Promo `STOKOS10` applies in cart

---

## TEST public QA sign-off

| Role | Name | Date | Signed |
|------|------|------|--------|
| Engineering (Azan) | | | [ ] |
| Operations (Abassi) | | | [ ] |

**Notes:**

---

## Live $1 test (after TEST sign-off + Stokos bank)

See [flip-to-live-checklist.md](./flip-to-live-checklist.md) — scheduled for later, not tomorrow.
