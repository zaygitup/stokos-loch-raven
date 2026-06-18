# Go-Live Status — Session Tracker

**Last updated:** 2026-06-19  
**Launch URL:** `https://stokos-loch-raven-git-main-bayentlabs.vercel.app`  
**Git:** `a2f8684` on `azank1/stokos-loch-raven` `main`  
**Tomorrow target:** Public TEST QA (Stripe test card, no live payments)

---

## Session progress

| Session | Owner | Status | Exit criteria |
|---------|-------|--------|---------------|
| **1** — Vercel public | Azan | **PENDING** | `npm run check:session1` passes (200 not 401) |
| **2** — Clerk + staff | Azan | **PENDING** | Admin sign-in works on prod URL |
| **Abassi handoff** | Azan → Abassi | **READY TO SEND** | [abassi-handoff-message.md](./abassi-handoff-message.md) |
| **3** — Env swap + QA | Azan | **BLOCKED** | Waiting on Abassi Mongo + Stripe TEST |
| **Sign-off** | Azan | **PENDING** | [qa-go-live-results.md](./qa-go-live-results.md) |

---

## Latest production check

```bash
npm run check:session1
```

| Route | Last status | Expected after Session 1 |
|-------|-------------|---------------------------|
| `/` | 401 | 200 |
| `/track` | 401 | 200 |
| `/admin/sign-in` | 401 | 200 |
| `/api/store/towson/menu` | 401 | 200 |

**Blocker:** Vercel Deployment Protection still ON.

---

## Azan — do now

1. Complete [azan-session-checklist.md](./azan-session-checklist.md) **Session 1**
2. Run `npm run check:session1` — must pass before Session 2
3. Send [abassi-handoff-message.md](./abassi-handoff-message.md) to Abassi
4. Complete **Session 2** (Clerk)
5. When Abassi replies → **Session 3**

---

## Abassi — waiting on

- [ ] Prod `MONGODB_URI` + migrated menu (3 stores)
- [ ] Stripe TEST webhook on bayentlabs URL
- [ ] `sk_test_...` + `whsec_...` to Azan

---

## Engineering complete (no code changes needed)

- All features on `main` (`a2f8684`)
- Session checklists + Abassi message docs
- `npm run check:session1`, `npm run smoke:test`, `npm run vercel:env-template`
- Local smoke: **8/8 PASS**

---

## Session log (fill in during back-and-forth)

### Session 1
```
Date:
Done:
Blockers:
Vercel redeployed:
check:session1 result:
```

### Session 2
```
Date:
Done:
Blockers:
Admin sign-in on prod: yes/no
```

### Session 3
```
Date:
Abassi secrets received: yes/no
QA checklist: pass/fail
Test order STK-:
```

---

## After TEST QA passes (not tomorrow)

- Stokos Stripe bank link ([stokos-stripe-bank-onboarding.md](./stokos-stripe-bank-onboarding.md))
- LIVE flip ([flip-to-live-checklist.md](./flip-to-live-checklist.md))
