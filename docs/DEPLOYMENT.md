# Deployment Guide 🚀

This guide explains how to deploy the React2Shell Scanner to **Vercel**.

## 🏗️ Prerequisites

- A [Vercel](https://vercel.com) account.
- The project pushed to a GitHub repository (done: https://github.com/AIAfterDark/react2shellscan.git).
- An [Upstash](https://upstash.com) account (recommended for production Redis/Rate Limiting).

## ⚡ Quick Start (Vercel Dashboard)

1. **Import Project**: Log in to Vercel and click "New Project". Import the `react2shellscan` repository.
2. **Framework Preset**: Vercel will automatically detect **Next.js**.
3. **Build & Output Settings**: Keep the defaults.
4. **Environment Variables**: Add the following (see [Environment Variables](#environment-variables) section below).
5. **Deploy**: Click "Deploy".

## 🗄️ Database Strategy

Since this project currently uses **SQLite** with `better-sqlite3`, it is **not compatible with Vercel's serverless functions** out of the box (filesystem is read-only).

### Recommended Production Options:

#### 1. Vercel Postgres (Recommended)
Switch from SQLite to Vercel Postgres for a seamless serverless experience.
- **Action**: Update `drizzle.config.ts` and `src/lib/db/index.ts` to use `drizzle-orm/postgres-js`.
- **Drizzle Kit**: Run `npm run db:push` against the Vercel Postgres connection string.

#### 2. Turso (SQLite in the Cloud)
If you want to stick with SQLite but in a serverless-friendly way.
- **Action**: Use `@libsql/client` instead of `better-sqlite3`.
- **Env**: Add `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN`.

## 🔑 Environment Variables

Required variables for a full production deployment:

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | A random string for session encryption. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Your production URL (e.g., `https://your-app.vercel.app`). |
| `GITHUB_ID` | GitHub OAuth ID (for authentication). |
| `GITHUB_SECRET` | GitHub OAuth Secret (for authentication). |
| `UPSTASH_REDIS_REST_URL` | For rate limiting (if implemented via Upstash). |
| `UPSTASH_REDIS_REST_TOKEN` | For rate limiting (if implemented via Upstash). |

## 🛠️ Post-Deployment Steps

1. **Database Migration**: If using an external DB (Turso/Postgres), ensure you run migrations:
   ```bash
   npx drizzle-kit push
   ```
2. **Domain Setup**: Add your custom domain in the Vercel project settings under "Domains".
3. **GitHub OAuth**: Update your GitHub OAuth application's "Callback URL" to match your production domain.

## ⚠️ Known Serverless Limitations

- **Scanning Duration**: Vercel's hobby tier has a 10s execution limit for serverless functions. Deep scans might require increasing this (Pro tier) or offloading to an Edge Function if the logic is compatible.
- **Local SQLite**: `sqlite.db` will **not persist** between requests on Vercel. You **must** move to a remote database (Turso/Postgres).
