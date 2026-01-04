# Vercel Deployment Guide 🚀

This document provides step-by-step instructions for deploying the React2Shell Scanner to **Vercel**.

## 1. Prerequisites

- A [Vercel](https://vercel.com) account.
- The project is available on GitHub (e.g., [https://github.com/AIAfterDark/react2shellscan.git](https://github.com/AIAfterDark/react2shellscan.git)).
- A remote database instance (Vercel is serverless, so local SQLite will not work for persistent data).

## 2. Important: Database Migration

Before deploying to Vercel, you must move away from the local `sqlite.db` because Vercel's filesystem is read-only and ephemeral.

### Option A: Turso (Recommended)
Turso is a managed SQLite-compatible database that works perfectly with Vercel.

1.  Install the Turso CLI: `curl -sSfL https://get.turso.tech/install.sh | bash`
2.  Create a database: `turso db create react2shell-db`
3.  Get connection details: `turso db show react2shell-db`
4.  Update your `src/lib/db/index.ts` to use `@libsql/client`.

### Option B: Vercel Postgres
1.  Create a Postgres database in your Vercel project dashboard.
2.  Vercel will automatically inject the `POSTGRES_URL` environment variables.
3.  Update your Drizzle config to use the Postgres driver.

## 3. Environment Variables

Add these variables in the **Vercel Dashboard > Settings > Environment Variables**:

| Key | Description |
| :--- | :--- |
| `DATABASE_URL` | Your Turso or Postgres connection string. |
| `DATABASE_AUTH_TOKEN` | (Optional) Required if using Turso. |
| `LIBSQL_URL` | (Optional) Turso connection string (used in some configurations). |
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis REST URL for rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis REST Token. |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate one. |
| `NEXTAUTH_URL` | Your production domain (e.g., `https://react2shellscan.vercel.app`). |
| `GITHUB_ID` | Your GitHub OAuth Application Client ID. |
| `GITHUB_SECRET` | Your GitHub OAuth Application Client Secret. |

## 4. Deployment Steps

1.  **Login to Vercel**: [vercel.com/new](https://vercel.com/new)
2.  **Import Repository**: Select `react2shellscan`.
3.  **Framework Preset**: Next.js (should be auto-detected).
4.  **Configure Project**:
    -   Keep Build Command as `npm run build`.
    -   Keep Output Directory as `.next`.
5.  **Environment Variables**: Paste the variables from Step 3.
6.  **Deploy**: Click the "Deploy" button.

## 5. Post-Deployment

- **Run Migrations**: Use Drizzle Kit to push your schema to the remote database:
  ```bash
  npx drizzle-kit push
  ```
- **Custom Domain**: Connect your domain in **Settings > Domains**.
- **GitHub OAuth**: Update the **Authorization callback URL** in your GitHub Developer settings to match your new production domain: `https://your-domain.vercel.app/api/auth/callback/github`.

## 6. Troubleshooting

- **Function Timeout**: If scans take longer than 10s, they may time out on the Hobby tier. Consider optimizing the scanning logic or upgrading to Pro for higher limits.
- **SQLite Error**: If you see "database is locked" or missing tables, ensure you are NOT using local `sqlite.db` on Vercel.

---
Built by LLMXLabs
