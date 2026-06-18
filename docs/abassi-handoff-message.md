# Message for Abassi — Copy & Send

**Send after Azan completes Session 1** (Deployment Protection OFF).  
**Deadline:** Tomorrow — TEST public QA (no live payments yet).

---

## Email / Slack (copy below)

**Subject:** Stokos prod infra needed by tomorrow — TEST mode only

Hi Abassi,

Code is deployed to:

`https://stokos-loch-raven-git-main-bayentlabs.vercel.app`

We need the following for **public TEST QA** (no live payments yet):

### 1. MongoDB production

- M10+ Atlas cluster with `stokos` database
- Migrate menu + store data from dev/Hamid cluster (all 3 stores: **towson**, **york**, **liberty**)
- Run indexes:
  ```bash
  node --env-file=.env.local scripts/mongodb-indexes.js
  ```
- Send securely: `MONGODB_URI` + confirm `MONGODB_DB=stokos`
- Checklist: [abassi-mongodb-checklist.md](./abassi-mongodb-checklist.md)

### 2. Stripe TEST (not live)

- **Webhook endpoint:**
  `https://stokos-loch-raven-git-main-bayentlabs.vercel.app/api/webhooks/stripe`
- **Event:** `checkout.session.completed`
- **Important:** Vercel Deployment Protection must stay **OFF** or webhooks receive 401
- Send securely:
  - `STRIPE_SECRET_KEY` (`sk_test_...`)
  - `STRIPE_WEBHOOK_SECRET` (`whsec_...`)
- **Do NOT** set `STRIPE_CONNECT_ACCOUNT_ID` in Vercel yet — TEST QA runs without Connect
- Checklist: [abassi-stripe-checklist.md](./abassi-stripe-checklist.md)

### 3. Optional (parallel — not blocking tomorrow TEST QA)

- Create Stokos Express connected account
- Send onboarding link to Stokos for bank setup (~10 min for client)
- Guide: [stokos-stripe-bank-onboarding.md](./stokos-stripe-bank-onboarding.md)

### 4. After we pass QA (later — not tomorrow)

- Flip to live keys + `STRIPE_CONNECT_ACCOUNT_ID`
- Checklist: [flip-to-live-checklist.md](./flip-to-live-checklist.md)

Thanks,  
Azan

---

## What Abassi should return

| Item | Format |
|------|--------|
| `MONGODB_URI` | `mongodb+srv://...` (password manager) |
| `MONGODB_DB` | `stokos` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from webhook above) |

Azan pastes these into Vercel Production → redeploy → Session 3 QA.

---

## Sent log

| Date | Channel | Sent by | Abassi acknowledged |
|------|---------|---------|---------------------|
| | | | [ ] |
