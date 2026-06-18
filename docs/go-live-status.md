# Go-Live Status — Production ASAP

**Last updated:** 2026-06-18  
**Git commit on `main`:** `6f78240` (pushed to `azank1/stokos-loch-raven`)  
**Launch URL:** `https://stokos-loch-raven-git-main-bayentlabs.vercel.app`

---

## Completed (engineering)

| Task | Status | Notes |
|------|--------|-------|
| Ship code | Done | Pushed `6f78240` to origin |
| MongoDB indexes | Done | Ran on configured cluster (`.env.local`) |
| Promo seed | Done | `STOKOS10`, `WELCOME5` in MongoDB |
| Go-live docs | Done | [go-live-handoff.md](./go-live-handoff.md), [go-live-checklist.md](./go-live-checklist.md) |
| Vercel env template | Done | `npm run vercel:env-template` |

---

## Blocked — requires dashboard / external owner

| Task | Owner | Blocker | Action |
|------|-------|---------|--------|
| Disable Deployment Protection | **Azan** | Vercel dashboard | Settings → Deployment Protection → OFF for Production. **Currently all routes return 401.** |
| Set Vercel env vars | **Azan** | Vercel dashboard | Run `npm run vercel:env-template`, fill values, redeploy |
| Clerk prod + staff | **Azan** | Clerk dashboard | [azan-clerk-vercel-checklist.md](./azan-clerk-vercel-checklist.md) |
| Prod MongoDB cluster | **Abassi** | Atlas | [abassi-mongodb-checklist.md](./abassi-mongodb-checklist.md) |
| Stripe TEST webhook | **Abassi** | Stripe dashboard | Endpoint: `{BASE_URL}/api/webhooks/stripe` |
| Full menu on prod DB | **Abassi + Azan** | Prod URI | `npm run import:menu` when prod URI in Vercel |
| Public QA + test checkout | **Azan** | After protection OFF + env | [qa-checklist.md](./qa-checklist.md) |
| Stokos bank link | **Stokos** | Stripe Express portal | [client-onboarding.md](./client-onboarding.md) |
| Flip to LIVE Stripe | **Abassi** | After bank + QA | Set `sk_live_`, `acct_`, live webhook |

---

## Smoke test results

### Production (Bayent Labs) — after deploy `6f78240`

```
SMOKE_BASE_URL=https://stokos-loch-raven-git-main-bayentlabs.vercel.app npm run smoke:test
→ 8/8 PASS (all 401 — Deployment Protection still ON)
```

**Next:** Disable protection → re-run smoke → expect **200** on all routes.

### Local (when `npm run dev` is running)

```
npm run smoke:test
→ expect 200 on all routes
```

---

## Immediate next steps for Azan (15 min)

1. Vercel → disable Deployment Protection on Production
2. `npm run vercel:env-template` → paste into Vercel env (use current `.env.local` values for Mongo/Stripe/Clerk until Abassi prod URI)
3. Redeploy Production
4. Re-run: `SMOKE_BASE_URL=https://stokos-loch-raven-git-main-bayentlabs.vercel.app npm run smoke:test`
5. Run [qa-checklist.md](./qa-checklist.md) with card `4242 4242 4242 4242`

---

## Immediate next steps for Abassi

1. Prod Atlas URI → Azan for Vercel
2. Stripe test webhook on bayentlabs URL
3. Express onboarding link → Stokos (parallel)

---

## Immediate next steps for Stokos

1. Complete Stripe bank onboarding when link arrives
2. Send manager emails to Azan
