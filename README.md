# Stoko's Loch Raven

Next.js web ordering app — customer menu/checkout and admin dashboard.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in MongoDB, Stripe, Clerk values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run seed:promos` | Seed sample promo codes (uses `MONGODB_URI`) |

## Deploy

Push to `main` on [zaygitup/stokos-loch-raven](https://github.com/zaygitup/stokos-loch-raven). Vercel deploys from connected Git integration.

Required environment variables are listed in [`.env.example`](.env.example).
