# System QA Checklist (Pre-Launch)

Run on **staging/preview** with test keys before Stokos handoff. Repeat critical paths on **production** after live keys (including $1 live order).

Record: **Pass / Fail**, **Tester**, **Date**, **Environment URL**

---

## 4.1 Customer flow

- [ ] Menu loads: `/store/towson`, `/store/york`, `/store/liberty`
- [ ] Add items with modifiers, size, toppings, note
- [ ] Pickup vs delivery; delivery address required for delivery
- [ ] Minimum order enforced when configured
- [ ] Tax and delivery fee appear in cart/checkout
- [ ] Stripe Checkout completes (test: `4242 4242 4242 4242`)
- [ ] Success page shows order summary
- [ ] `/track` finds order by number

---

## 4.2 Payment + data

- [ ] Webhook marks order **Confirmed / Paid** within ~30s
- [ ] Order in `/admin/orders` with correct branch and amounts
- [ ] Abandoned checkout shows **Awaiting Payment** in admin list
- [ ] If Connect enabled: Stripe Dashboard shows transfer + platform fee

---

## 4.3 Admin auth

- [ ] Allowed email → `/admin` loads
- [ ] Non-allowed email → `/admin/sign-in?error=unauthorized`
- [ ] Signed out → redirect to `/admin/sign-in`
- [ ] Footer **Staff Login** → `/admin/sign-in`

---

## 4.4 Admin operations

- [ ] Branch pills filter dashboard stats and orders queue
- [ ] Advance status: Placed → Confirmed → Preparing → Ready → Completed
- [ ] Cancel unpaid order
- [ ] Cancel paid order shows refund warning

---

## 4.5 Cross-environment

- [ ] Mobile Chrome / Safari — cart and checkout
- [ ] Vercel deployment SHA matches target Git commit

---

## Exit criteria

- All items pass on staging with test keys
- Live $1 order + refund passes after Abassi switches live Stripe keys
