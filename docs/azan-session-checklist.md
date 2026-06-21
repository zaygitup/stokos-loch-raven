# Azan Manual Sessions — TEST Public QA

**Goal:** Public Bayent Labs URL open + Stripe TEST checkout + full QA by tomorrow.  
**URL:** `https://stokos-loch-raven-git-main-bayentlabs.vercel.app`  
**Git:** `azank1/stokos-loch-raven` → `main` (commit `a2f8684`)

After each session, report to engineering using the format at the bottom.

---

## Session 1 — Unblock public access (~15 min)

| # | Task | Done |
|---|------|------|
| 1.1 | Vercel → Bayent Labs project → Settings → **Deployment Protection OFF** for Production | [ ] |
| 1.2 | Set `NEXT_PUBLIC_BASE_URL` = `https://stokos-loch-raven-git-main-bayentlabs.vercel.app` (no trailing slash) | [ ] |
| 1.3 | Copy interim env from `.env.local` into Vercel **Production**: `MONGODB_URI`, `MONGODB_DB`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_EMAILS` | [ ] |
| 1.4 | **Leave unset:** `STRIPE_CONNECT_ACCOUNT_ID`, `STRIPE_PLATFORM_FEE_PERCENT` | [ ] |
| 1.5 | Redeploy Production | [ ] |

**Verify:**
```bash
npm run check:session1
# or
SMOKE_BASE_URL=https://stokos-loch-raven-git-main-bayentlabs.vercel.app npm run smoke:test
```
**Exit criteria:** All routes return **200** (not 401).

---

## Session 2 — Clerk + staff (~30 min)

See [azan-clerk-vercel-checklist.md](./azan-clerk-vercel-checklist.md)

| # | Task | Done |
|---|------|------|
| 2.1 | Clerk → Sessions → Customize session token → `{ "email": "{{user.primary_email_address}}" }` | [ ] |
| 2.2 | Create staff users in Clerk Dashboard (Towson, York, Liberty) — no self-service sign-up | [ ] |
| 2.3 | Set `ADMIN_EMAILS` in Vercel to those emails (comma-separated) | [ ] |
| 2.4 | Add production URL to Clerk allowed origins | [ ] |
| 2.5 | Redeploy if env changed | [ ] |
| 2.6 | Browser test: allowed email → `/admin` loads | [ ] |
| 2.7 | Browser test: other email → `/admin/sign-in?error=unauthorized` | [ ] |

**Exit criteria:** You can sign in as admin on the production URL.

---

## Session 3 — Abassi secrets + full QA (~1–2 hours)

**Prerequisite:** Abassi delivered prod `MONGODB_URI` + Stripe TEST keys (see [abassi-handoff-message.md](./abassi-handoff-message.md)).

| # | Task | Done |
|---|------|------|
| 3.1 | Replace Vercel Production: `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | [ ] |
| 3.2 | Redeploy Production | [ ] |
| 3.3 | `npm run seed:promos` against prod MongoDB (update `.env.local` URI first or run on Abassi side) | [ ] |
| 3.4 | Verify menus: `/store/towson`, `/store/york`, `/store/liberty` | [ ] |
| 3.5 | If menu incomplete: `npm run import:menu path/to/menu.csv` + admin menu rebuild | [ ] |
| 3.6 | Full [qa-checklist.md](./qa-checklist.md) on public URL | [ ] |
| 3.7 | Test checkout card `4242 4242 4242 4242` | [ ] |
| 3.8 | Webhook → order **Confirmed / Paid** in `/admin/orders` | [ ] |
| 3.9 | Guest track `/track?orderNumber=STK-...` | [ ] |
| 3.10 | Account sign-in → `/account/orders` → reorder | [ ] |
| 3.11 | Promo `STOKOS10` in cart | [ ] |
| 3.12 | Update [qa-go-live-results.md](./qa-go-live-results.md) with Pass/Fail | [ ] |

**Exit criteria:** All qa-checklist items pass on public URL with TEST Stripe.

---

## Report format (paste after each session)

```
Session: 1 / 2 / 3
Done: [list items]
Blockers: [any]
Vercel redeployed: yes/no
```

---

## Quick commands

```bash
npm run vercel:env-template      # env var list for Vercel
npm run check:session1           # fails until production returns 200
npm run smoke:test               # local
npm run seed:promos              # promo codes on current MONGODB_URI
```
