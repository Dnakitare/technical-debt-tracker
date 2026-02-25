# DebtLens

Track, estimate, and reduce your technical debt cost. Connect your GitHub repositories and get instant visibility into debt trends, cost estimates, and team progress.

## Features

- **GitHub Integration** — Connect repos with one click; scans issues, PRs, and code comments for debt items
- **Cost Estimation** — Translate debt into dollar amounts with configurable hourly rates and priority-based estimates
- **Trend Dashboard** — Visualize debt over time with interactive charts and summary cards
- **Team Collaboration** — Invite members, manage roles, and coordinate paydown efforts
- **Priority Breakdown** — Categorize debt by severity and focus on high-impact items first
- **Automated Sync** — Keep your debt inventory current with scheduled GitHub syncing
- **Billing & Plans** — Stripe-powered subscriptions with Free, Starter, Pro, and Enterprise tiers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Payments | Stripe |
| GitHub API | Octokit |
| Charts | Recharts |
| State | TanStack React Query |
| Icons | Lucide React |

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project (or the local CLI)
- A [Stripe](https://stripe.com) account with test-mode keys
- A GitHub OAuth App

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/dnakitare/technical-debt-tracker.git
cd technical-debt-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe price ID for Starter plan |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | Stripe price ID for Enterprise plan |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `NEXT_PUBLIC_SITE_URL` | Base URL (e.g. `http://localhost:3001`) |

### 4. Set up the database

Start Supabase locally or apply migrations to your hosted project:

```bash
npx supabase start        # local
npx supabase db push      # remote
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 6. Forward Stripe webhooks (optional, for billing)

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                #   REST API routes
│   │   ├── auth/           #     Auth callbacks
│   │   ├── github/         #     GitHub OAuth & repo endpoints
│   │   ├── repos/          #     Repository sync & metrics
│   │   ├── teams/          #     Team & invite management
│   │   ├── stripe/         #     Checkout & portal sessions
│   │   └── webhooks/       #     Stripe webhooks
│   ├── dashboard/          #   Authenticated dashboard pages
│   │   ├── repos/          #     Repo list, detail, connect
│   │   ├── team/           #     Team members & invites
│   │   ├── billing/        #     Subscription management
│   │   └── settings/       #     User settings
│   ├── login/              #   Login page
│   └── register/           #   Registration page
├── components/             # React components by feature
│   ├── ui/                 #   Base UI primitives
│   ├── dashboard/          #   Charts & summary cards
│   ├── repos/              #   Repo-specific components
│   ├── team/               #   Team management components
│   ├── billing/            #   Pricing cards & billing UI
│   ├── layout/             #   Sidebar, nav
│   └── providers/          #   React Query, etc.
├── lib/                    # Shared utilities & constants
│   └── supabase/           #   Supabase client helpers
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── supabase/               # Supabase migrations & config
└── public/                 # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking (`tsc --noEmit`) |

## Architecture

- **App Router** — All pages use the Next.js App Router with server components by default; client components are opted in with `"use client"`.
- **Authentication** — Supabase Auth with email/password. GitHub OAuth is used separately for repo access tokens.
- **Data Pipeline** — On sync, the API fetches issues/PRs from GitHub via Octokit, classifies debt items, computes cost estimates, and stores snapshots in Supabase.
- **Row Level Security** — Supabase RLS policies ensure users can only access data belonging to their team.
- **Billing** — Stripe Checkout for subscriptions, Stripe Customer Portal for management, webhooks for status updates. Plan limits are enforced server-side.

## Deployment

Deploy to [Vercel](https://vercel.com) for the easiest setup:

1. Push your repo to GitHub
2. Import the project in Vercel
3. Add all environment variables from the table above
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain
5. Configure Stripe webhooks to point to `https://yourdomain.com/api/webhooks/stripe`

## License

MIT
