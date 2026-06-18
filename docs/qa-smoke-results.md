# QA Smoke Results — Automated

**Date:** 2026-06-18  
**Commit:** (see git log after push)

## Local (localhost:3000)

| Check | Status |
|-------|--------|
| `/` | 200 |
| `/store/towson` | 200 |
| `/track` | 200 |
| `/admin/sign-in` | 200 |
| `/api/store/towson/menu` | 200 |

## Production (stokos-loch-raven.vercel.app)

| Check | Status | Notes |
|-------|--------|-------|
| `/` | 200 | |
| `/track` | 404 | Deploy lag — push to zaygitup/main required |
| `/admin/sign-in` | 404 | Deploy lag — push to zaygitup/main required |

## Manual QA

Complete remaining items in [qa-checklist.md](./qa-checklist.md) after Vercel deploys latest `main`.

## Live $1 test

Pending Abassi live Stripe keys + Connect onboarding (see [abassi-stripe-checklist.md](./abassi-stripe-checklist.md)).
