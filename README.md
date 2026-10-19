# MeechieOS

MeechieOS is a multi-tenant nonprofit operating system concept. It helps a team run community programs, events, volunteers, fundraising, inventory, communications, and impact reporting.

The first demonstration organization is **The Meechie Project**, a fictionalized Dallas workspace. A second tenant, Northside Family Alliance, shows that records stay separated by organization. Nothing in the sample data is a real person, gift, or outcome.

Product tagline: **Powering Community Impact**.

## Requirements

- Node.js 20.19 or newer is recommended. The app was developed against Node 20.
- npm

## Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Explore the demo

1. Choose **Explore demo** on the home page. You enter as Jordan Hale, organization admin for The Meechie Project. No password is used.
2. A product tour starts on the dashboard. Skip it or restart it from **Help and support** in the sidebar.
3. The Back-to-School Community Giveaway event walks through publish, registration, volunteer assignment, check-in, and a summary.
4. Use the **Organization** menu to switch to Northside Family Alliance. Lists, charts, and totals change with the tenant.
5. Use the **Demo role** menu to preview a program manager, volunteer coordinator, finance manager, volunteer, community member, sponsor, or platform super admin.
6. The public community portal is at [/portal](http://localhost:3000/portal). Submissions are stored in the demo and appear in the Meechie Project admin views.
7. Platform administration is at [/platform](http://localhost:3000/platform). Sign in as Avery Quinn, or use the button on that page.

## Reset sample data

Open **Help and support** or **Settings** and choose **Reset demo data**. This restores the original fictional dataset in this browser. Your current demo profile stays signed in.

Refreshing the browser keeps changes until you reset them. Data lives in `localStorage` under `meechieos.demo.v1`. That storage is a demo convenience, not tenant security.

## Tests

```bash
npm test
npm run typecheck
```

Tests cover seed integrity, organization isolation, donation totals, registration duplicates, event capacity, check-in, and inventory that cannot go below zero.

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

Operational types live in `src/types/models.ts`. Monetary amounts are integer cents. Derived metrics are calculated in `src/lib/domain/metrics.ts` from attendance, service logs, completed donations, expenses, and the inventory ledger. Workflows such as registration and stock movement live in `src/lib/domain/workflows.ts`.

The UI talks to a Zustand store. The store calls those workflows and persists through `src/lib/repositories/local.ts`. Replace that repository with a Firebase implementation without rewriting the screens.

Permissions are declared in `src/lib/permissions/index.ts`. The demo role switcher only changes the client experience. Production must enforce the same permissions in server code and Firebase Security Rules.

## Firebase later

Copy `.env.example` to `.env.local` when you are ready. The demo ignores empty values. `src/lib/firebase/config.ts` reads the public web config and does not ship a secret.

Before using Firebase:

- Add Authentication and stop trusting the demo role switcher.
- Store every organization-owned document with `organizationId`.
- Enforce reads and writes in Security Rules from custom claims, not from the client role.
- Move payment capture to a server endpoint and a provider such as Stripe. Keep using integer cents. Never collect raw card numbers in this app.
- Send email, SMS, and WhatsApp through a provider after checking consent. The communications hub currently only writes a local activity log.
- Store files in Cloud Storage with tenant-scoped paths.
- Add audit retention, backups, and a privacy review before any real household data is entered.

## Production roadmap

This concept does not include production authentication, authorization, payments, message delivery, secure storage, privacy compliance, audit retention, or backups.

Still required:

1. **Authentication.** Replace demo personas with Firebase Auth or an equivalent identity provider.
2. **Authorization.** Enforce roles on the server and in Security Rules. Client checks are only a preview.
3. **Payments.** Integrate a processor. The donation model already stores amount, method, status, and a reference.
4. **Messaging.** Connect an email provider, Twilio, and WhatsApp Business. Keep the consent flags.
5. **Storage and privacy.** Encrypt backups, limit personal data, and document retention. Do not add Social Security numbers or detailed medical information.
6. **Audit and backups.** Persist the audit stream outside the browser and test restore procedures.
7. **Billing.** The Starter ($49), Growth ($149), and Enterprise (custom) prices are samples, not invoices.

## Sample scale

The Meechie Project seed includes 150 community members, 65 households, 35 volunteers, 12 donors, 8 sponsors, 6 programs, 15 events, 60 donations, 20 inventory items, 100 registrations, and 80 attendance records. All of it is generated and fictional.
