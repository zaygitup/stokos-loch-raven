# Flip to LIVE — Checklist (Abassi)

Run **after** public TEST QA passes and Stokos completes bank onboarding.

---

## Pre-flight

- [ ] [qa-go-live-results.md](./qa-go-live-results.md) — production manual QA signed off
- [ ] Stokos Express account: `charges_enabled` + `payouts_enabled`
- [ ] Vercel Deployment Protection still **OFF**

---

## Vercel Production env updates

| Variable | Change to |
|----------|-----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Live webhook `whsec_...` for `{BASE_URL}/api/webhooks/stripe` |
| `STRIPE_CONNECT_ACCOUNT_ID` | Stokos `acct_...` |
| `STRIPE_PLATFORM_FEE_PERCENT` | e.g. `1.5` |

Redeploy Production.

---

## Live verification

1. [ ] Place **$1 live order** on production URL
2. [ ] Admin: order **Confirmed / Paid**
3. [ ] Stripe Dashboard: payment + Connect transfer + platform fee
4. [ ] Refund test order
5. [ ] Azan: staff handoff call ([client-onboarding.md](./client-onboarding.md))

---

## Rollback

If live test fails, revert Vercel to TEST keys and investigate webhook logs before retrying.
