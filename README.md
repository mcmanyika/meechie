# The Meechie Project

Staff and community tools for **The Meechie Project** — programs, events, volunteers, fundraising, inventory, and impact reporting in Dallas.

Product tagline: **Love, joy, and community in Dallas**.

## Requirements

- Node.js 20.19 or newer is recommended.
- npm

## Environment

Copy `.env.example` to `.env.local` and set at least:

- `NEXT_PUBLIC_APP_URL` — canonical site origin (e.g. `https://meechie.vercel.app`). Used for donate embed links and Stripe success/cancel URLs.
- Firebase / Stripe keys as needed.

On Vercel, add the same variables in Project Settings → Environment Variables (Production).

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

## Public donate buttons (production)

Give pages are published to **Cloud Firestore** (`givingProfiles/{slug}`). The previous local `.data/giving.json` file does not persist on Vercel.

1. Create a Firestore database in the Firebase project (same project as Auth).
2. Deploy [firestore.rules](firestore.rules) so the public can read profiles and signed-in staff can write them:
   `firebase deploy --only firestore:rules`
3. Sign in as staff, open Fundraising, and save/create a donate button (that republishes the give page).
4. Open `/give/meechie` (or your slug) to confirm the button loads.

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
