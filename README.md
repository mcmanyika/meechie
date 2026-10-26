# The Meechie Project

Staff and community tools for **The Meechie Project** — programs, events, volunteers, fundraising, inventory, communications, and impact reporting in Dallas.

Product tagline: **Love, joy, and community in Dallas**.

## Requirements

- Node.js 20.19 or newer is recommended.
- npm

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Explore

1. Sign in with your staff account (Firebase email/password). Admin: `manyikapartson@gmail.com` when that account exists in Firebase Auth.
2. Use the dashboard for programs, events, volunteers, donations, and impact reports.
3. The public community portal is at [/portal](http://localhost:3000/portal). Donations: [/give/meechie](http://localhost:3000/give/meechie).

## Reset workspace data

Open **Help and support** or **Settings** and choose **Reset workspace data**. That clears local records and reseeds org, admin, and programs only. Data lives in `localStorage` under `meechieos.demo.v8`.

## Tests

```bash
npm test
npm run typecheck
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## Architecture

Next.js App Router client app with a local demo database (Zustand + `localStorage`). Stripe Checkout handles card/ACH gifts. Firebase Auth supports email/password sign-in. Organization records stay scoped to The Meechie Project.
