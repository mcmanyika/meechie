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

1. Choose **Explore demo** or sign in. You enter as Jordan Hale (executive director). No password is required for the demo path.
2. A product tour starts on the dashboard. Skip it or restart it from **Help and support**.
3. The Back-to-School Meechie Giveaway walks through publish, registration, volunteer assignment, check-in, and a summary.
4. Use the **Staff role** menu to preview finance, volunteer, community, or sponsor views.
5. The public community portal is at [/portal](http://localhost:3000/portal). Donations: [/give/meechie](http://localhost:3000/give/meechie).

## Reset sample data

Open **Help and support** or **Settings** and choose **Reset demo data**. Data lives in `localStorage` under `meechieos.demo.v3`.

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
