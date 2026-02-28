# Meli

Meli provides an interactive product tour that enables teams to make user onboarding seamless.

## Features

- Public site (`/`)
- Pricing page (`/pricing`) with Stripe Checkout
- Dashboard with CRUD operations on users/teams/tours
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication and Google OAuth
- Stateless JWT sessions via `jose`
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) — lives in the turbo workspace under `packages/ui`

## Getting Started

```bash
git clone git@github.com:mmurakaru/meli-turbo.git
cd meli-turbo
pnpm install
```

## Running Locally

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- [Docker](https://www.docker.com/) — for the local Postgres database
- [Stripe CLI](https://stripe.com/docs/stripe-cli) — for local webhook forwarding

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### Guided setup (recommended)

From the monorepo root, run:

```bash
pnpm setup
```

This installs dependencies and runs the interactive setup for all apps.

It will start Docker, create `.env.local`, run migrations, seed the database, and optionally set up Stripe products.

### Manual setup

<details>
<summary>Step by step</summary>

**1. Environment variables**

Copy the example file and fill in your values:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

| Variable | How to get it |
|---|---|
| `POSTGRES_URL` | `postgres://postgres:postgres@localhost:54322/postgres` for local Docker |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com) — create an OAuth 2.0 client, add `http://localhost:3000/auth/callback` as an authorized redirect URI |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Printed by `stripe listen` in step 4 |
| `BASE_URL` | `http://localhost:3000` for local development |

> `NODE_ENV` is set automatically by Next.js — do not set it manually.

**2. Start the database**

```bash
cd apps/web
docker compose up -d
```

**3. Run migrations and seed**

```bash
pnpm db:migrate
pnpm db:seed
```

Default credentials: `test@test.com` / `admin123`

**4. Forward Stripe webhooks**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

</details>

### Start the dev server

```bash
pnpm dev          # from monorepo root
pnpm dev --filter web  # scoped
```

Open [http://localhost:3000](http://localhost:3000).

### Stopping local services

```bash
docker compose down
```

## Database

| Script | Description |
|---|---|
| `pnpm db:generate` | Generate a new migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed a test user and team |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm stripe:setup` | Create Stripe products and prices (run once) |

See [Drizzle migration docs](https://orm.drizzle.team/docs/migrations) for more options.

## Testing Payments

Use the following Stripe test card:

- Card number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

## Going to Production

### Stripe webhook

1. In the Stripe Dashboard, create a webhook pointing to `https://yourdomain.com/api/stripe/webhook`.
2. Subscribe to `customer.subscription.updated` and `customer.subscription.deleted` events.
3. Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in your deployment environment.

### Deploy to Vercel

1. Push your code to GitHub.
2. Import the repository in Vercel and set the root directory to `apps/web`.
3. Add the following environment variables:

| Variable | Notes |
|---|---|
| `POSTGRES_URL` | Production database connection string |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Add your production domain as an authorized redirect URI |
| `STRIPE_SECRET_KEY` | Use the live key in production |
| `STRIPE_WEBHOOK_SECRET` | From the production webhook above |
| `BASE_URL` | e.g. `https://yourdomain.com` |

## Testing the npm package locally

```bash
npm i yalc -g       # install yalc globally once
yalc publish        # in the package directory
yalc push           # push updates
yalc add <package>  # in the consuming project
```
