# Developer claims vs repository evidence

**Subject repo:** [Hamid6319/stokos-loch-raven](https://github.com/Hamid6319/stokos-loch-raven) (original public repo, 140 commits)  
**Reference / launch repo:** [azank1/stokos-loch-raven](https://github.com/azank1/stokos-loch-raven) (fork with production path)  
**Context:** Stoko's client ordering — internal audit for software lead / management  
**Eid 2026:** ~6–7 June · **As of:** 19 June 2026 (~2–3 weeks post-Eid)

This table maps **what was claimed** (WhatsApp, management, or narrative) against **verifiable proof** (git commits, file paths, or his own later admission).  
“Deceptive” here means: **stated or implied readiness/timeline that the repo or later messages contradict** — not necessarily intentional fraud, but **misleading to anyone who cannot read the code**.

---

## 1. Timeline and status claims

| # | Claim (what was said) | Stated timeline / implication | Proof (commits & facts) | Verdict |
|---|------------------------|-------------------------------|-------------------------|---------|
| 1 | “CRUD fully completed previous week” | CRUD + demo path done by ~10 Jun | **`031a618`** (2026-06-10): *“product crud , category crud , modifier crud and upsells product crud”* — then **15+ commits Jun 15–18** still on menu load/sync: `d3becca`, `b2cd656`, `c4aaf5a`, `dc46fdf`, `4a68013`, etc. | **Misleading** — same week declared done, next week still fixing core demo path |
| 2 | “3–4 days resolving store menu + admin load” | Normal dev overhead after CRUD | Jun 15–18 commits are **only** menu loading/polling/auto-update (e.g. **`dc46fdf`**, **`4a68013`**, **`bf1f7bb`**). That load/sync **is** the Eid MVP (admin → customer menu), not extra scope | **Reframe** — spent days on the deliverable itself, not “on top of” finished work |
| 3 | “Issue totally resolved / ab delay nahi ata” (30s load fixed) | Menu E2E fixed, no more delay | **`components/menusectionclient.tsx`**: `MENU_POLL_INTERVAL_MS = 1000` — customer menu **polls every 1 second**. **`ebe70ff`** (2026-06-18, same day): *“redesigned prcing table”* — UI polish, not architecture fix | **Partially true at best** — faster load ≠ resolved design; workaround remains |
| 4 | “Development phase main issues aate hain — normal” | Weeks of delay acceptable | **11+** commit messages matching `loading menu` / `code updated` post-Eid; **0** commits on auth, webhooks, or DB orders on his repo | **Misleading** — same symptom repeated is not “normal phase,” it’s unfixed root cause |
| 5 | GPT / chat: **1–1.5 months** dev **before** testing & deployment | Test/deploy only after another month+ | **`docs/qa-checklist.md`** and deploy already exist on launch fork; **`qa-smoke-results.md`** dated 2026-06-18. Vercel deploy live. Testing phase **already started** elsewhere | **False timeline** — inverted lifecycle |
| 6 | Prior commitment: **3–4 months** full system to deployment | Long runway | ~1 month elapsed; his repo still has **no** order model, **no** Clerk, **no** webhook — admitted auth/orders **“abhi start krna hay”** | **Slipped** — volume of UI commits ≠ launch progress |
| 7 | Prior commitment: **1 month frontend only** (Restarage backend) | Frontend-only scope | His repo has heavy **backend** menu APIs (`app/api/admin/menu/*`, Mongo models) but **no** production order backend — scope story changed | **Inconsistent** |
| 8 | **7 days impossible** — sent long “remaining work” list to management | Needs ~1 month | Same list included **Clerk auth, order status, delivery/tax, guest track** as “remaining.” Later: **“admin auth , real order abhi start krna hay”** | **Deceptive** — used **not-started** work as **blocking** timeline |
| 9 | Eid agreement: demo **after Eid** — admin CRUD → customer menu | Due within days/weeks after ~6 Jun | **No demo video/URL shared** by ~19 Jun. **55 commits** on his repo Jun 7–18; last **`ebe70ff`** = pricing table redesign | **Not delivered** — activity ≠ demo sign-off |
| 10 | “We discussed at Eid — MVP is menu E2E only” | Narrow scope when challenged | Same period: told Tariq **auth/orders/track** still to do (1 month list). Admits auth/orders **not started** | **Moving goalposts** |

---

## 2. “Ready / fullstack” claims vs his public repo

| # | Claim or implied readiness | What sales/client would assume | Proof on **Hamid6319/stokos-loch-raven** | Verdict |
|---|----------------------------|--------------------------------|------------------------------------------|---------|
| 11 | Admin dashboard is production-ready | Staff login, secure admin | **No** `@clerk`, **no** `proxy.ts`, **no** `/admin/sign-in` — grep entire repo: **zero** auth middleware | **Looks ready, is not** |
| 12 | Orders dashboard works | Real orders from customers | **`orderdashboard.tsx` L53–64**: `STORAGE_KEY = "stokos_admin_orders"` → **`localStorage.getItem`** — no `/api/admin/orders` | **Fake for production** — one-browser demo only |
| 13 | Checkout / payments complete | Order saved, kitchen sees it | **`app/api/checkout/route.ts`** (~162 lines): Stripe session only — **no** `Order.create`, **no** Mongo, **no** delivery/tax from store | **Payment UI only** |
| 14 | Paid orders update status | Webhook → Confirmed | **No** `app/api/webhooks/stripe/route.ts` on his repo | **Not built** |
| 15 | Guest order tracking | Track by order # | **No** `app/track/page.tsx`, **no** `/api/orders/track` | **Not built** |
| 16 | Order status machine | Placed → … → Completed | **No** `lib/orderstatus.ts`, **no** PATCH order API | **Not built** (UI may show labels from localStorage only) |
| 17 | Full menu admin / CRUD | Engineering-complete backend | **140 commits**, **`productform.tsx` ~3032 lines**, **`usemenucrud.ts` ~1923 lines** — **`RESPONSE_KEYS`** guesses JSON shapes | **Wide but fragile** — volume ≠ quality |
| 18 | Menu sync admin → customer | Reliable E2E | **`MENU_POLL_INTERVAL_MS = 1000`** + commits **`2d5e9c2`→`dc46fdf`→`4a68013`** (same issue, many attempts) | **Hack, not engineering** |
| 19 | “Fullstack developer” | Auth + DB + API + UI | Own message: **“admin auth , real order abhi start krna hay”** | **Self-contradiction** |
| 20 | Project deployable / live | Client can use today | README = default create-next-app; **no** `docs/`; orders don’t survive browser change | **Deploy ≠ production-ready** |

---

## 3. Commit evidence index (quick reference)

| Date | Commit | Message | Why it matters |
|------|--------|---------|----------------|
| 2026-06-10 | **`031a618`** | product/category/modifier/upsells **CRUD complete** | Baseline for “done last week” claim |
| 2026-06-15 | **`d3becca`** | loading menu issues — testing | Still broken 5 days after “CRUD complete” |
| 2026-06-16 | **`b2cd656`** | loading menu delay issue resolve | Same issue |
| 2026-06-17 | **`407bcd5`–`9f3d292`** | category form coded / coded 2 / coded 3 | One form, 3 vague commits |
| 2026-06-18 | **`c4aaf5a`**, **`bf1f7bb`**, **`81db035`** | loading menu issue resolve (×N) | Same issue |
| 2026-06-18 | **`2d5e9c2`→`4a68013`** | auto update menu → Improve polling | Symptom patching |
| 2026-06-18 | **`dc46fdf`** | Fix customer menu auto-update polling | Still polling-based |
| 2026-06-18 | **`ebe70ff`** | redesigned prcing table | Last commit = UI polish, not auth/orders |
| 2026-06-18 | **`9b58095`** *(azank1 fork)* | launch readiness — orders, Clerk, tax, status | Real launch path **not on his repo** |
| 2026-06-18 | **`9f10ddf`** *(azank1 fork)* | harden admin auth | His repo: still no Clerk |
| 2026-06-19 | WhatsApp | “admin auth , real order **abhi start krna hay**” | Admits items from “1 month remaining” list **not started** |

---

## 4. The deception pattern (summary)

| Layer | What they see | What repo shows |
|-------|---------------|-----------------|
| **UI/UX** | Admin panel, menu pages, order cards, Stripe button | ✓ Exists — **this is what sells “90% done”** |
| **Security** | “Admin is ready” | ✗ Open `/admin`, open `/api/admin/*` |
| **Data** | “Orders flowing” | ✗ `localStorage` only — **`success/page.tsx`** `saveOrderForAdmin` |
| **Money path** | “Taking payments” | ✗ No webhook, no persisted order — checkout **`031a618`** era stub |
| **Timeline** | “Need 1 month / 7 days impossible” | ✗ Auth/orders **not started** — used as excuse |
| **Demo** | “CRUD complete / resolved” | ✗ No post-Eid screen recording; **15+** menu fix commits after “complete” |

---

## 5. One-sentence summary for management

> **The public repo looks ready because the screens are built; it was never client-ready because orders live in the browser, admin has no login, checkout does not write to the database, and the developer admitted auth and real orders still need to be started — while telling leadership those same items required another month.**

---

## 6. How to verify (5 minutes, no trust required)

1. Clone [Hamid6319/stokos-loch-raven](https://github.com/Hamid6319/stokos-loch-raven)  
2. Confirm **no** `models/order.ts`, **no** `app/admin/sign-in`, **no** `app/api/webhooks/stripe`  
3. Open `app/admin/components/orderdashboard.tsx` → search **`localStorage`**  
4. Open `components/menusectionclient.tsx` → search **`MENU_POLL_INTERVAL_MS = 1000`**  
5. Run `git log --since=2026-06-10 --oneline` → count menu-loading vs auth/order commits  

---

*Internal document. Update if new claims or commits are made. Launch truth lives on azank1 fork + prod checklists in `docs/`.*
