# GitHub Actions & CI/CD Deployment Pipeline

Quiizee uses **GitHub Actions** (`.github/workflows/deploy.yml`) to automatically build and deploy the Next.js 16 application to **Cloudflare Workers** whenever commits are pushed to the `master` branch.

---

## Workflow Overview (`deploy.yml`)

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - master

jobs:
  deploy:
    name: Build & Deploy to Cloudflare Workers
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: PRODUCTION

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: "npm"

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Build and Deploy to Cloudflare Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          AUTH_URL: ${{ secrets.AUTH_URL || 'https://quiizee.krisnantobiyuh.workers.dev' }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL || 'https://quiizee.krisnantobiyuh.workers.dev' }}
        run: |
          echo "Memulai kompilasi dan deploy ke Cloudflare..."
          npm run deploy

      - name: Set Environment Variables for Cloudflare Runtime
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          echo "Mengirimkan rahasia runtime ke Cloudflare..."
          npx wrangler secret put DATABASE_URL <<< "${{ secrets.DATABASE_URL }}"
          npx wrangler secret put AUTH_SECRET <<< "${{ secrets.AUTH_SECRET }}"
          if [ -n "${{ secrets.AI_API_URL }}" ]; then npx wrangler secret put AI_API_URL <<< "${{ secrets.AI_API_URL }}"; fi
          if [ -n "${{ secrets.AI_API_KEY }}" ]; then npx wrangler secret put AI_API_KEY <<< "${{ secrets.AI_API_KEY }}"; fi
          if [ -n "${{ secrets.AI_MODEL }}" ]; then npx wrangler secret put AI_MODEL <<< "${{ secrets.AI_MODEL }}"; fi
          npx wrangler secret put AUTH_URL <<< "${{ secrets.AUTH_URL }}"
          npx wrangler secret put NEXTAUTH_URL <<< "${{ secrets.NEXTAUTH_URL }}"
```

---

## Key Pipeline Steps Explained

### 1. Build and Deploy (`npm run deploy`)
- **Command**: Executes `opennextjs-cloudflare build && opennextjs-cloudflare deploy -- --keep-vars` as defined in `package.json`.
- **Why `--keep-vars`?**: When `wrangler deploy` executes via OpenNext, `--keep-vars` prevents Cloudflare from overwriting or wiping environment variables and bindings already stored in the remote Worker environment dashboard.
- **Node Version**: The workflow runs on **Node.js v24**, ensuring compatibility with modern Next.js 16 requirements and OpenNext tooling.

### 2. Runtime Secret Injection (`npx wrangler secret put`)
Because Cloudflare Workers encrypt secret environment variables separately from `wrangler.jsonc`, the workflow explicitly pushes secrets (`DATABASE_URL`, `AUTH_SECRET`, `AI_API_KEY`, etc.) directly to Cloudflare via `wrangler secret put <<< "${{ secrets.SECRET_NAME }}"`.
- Using `<<< "${{ secrets.SECRET }}"` (herestring redirection) ensures secrets are passed securely without exposing them directly in command-line arguments.
- Conditional checks (`if [ -n "${{ secrets.AI_API_KEY }}" ]; then ...`) prevent the pipeline from failing if optional AI secrets are omitted in specific staging/fork environments.

---

## Required GitHub Repository Secrets

To ensure the CI/CD pipeline executes successfully, the following secrets must be configured inside **GitHub Repository Settings -> Secrets and variables -> Actions**:

| Secret Name | Required | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | **Yes** | Cloudflare API Token with `Workers Scripts:Edit`, `Workers Routes:Edit`, and `Account Settings:Read` permissions. | `cf-api-token-xxx...` |
| `CLOUDFLARE_ACCOUNT_ID` | **Yes** | 32-character Cloudflare Account ID found in the Cloudflare dashboard sidebar. | `a1b2c3d4...` |
| `DATABASE_URL` | **Yes** | Supabase Postgres connection string (Pooler URL over IPv4). | `postgresql://postgres.[ref]:[pass]@aws-1...pooler.supabase.com:6543/postgres` |
| `AUTH_SECRET` | **Yes** | 32+ character random secret string used to encrypt JWT cookies and session tokens. | `cmVwbGFjZS0...` |
| `AUTH_URL` / `NEXTAUTH_URL` | **Yes** | Canonical HTTPS URL where the live application is hosted on Cloudflare Workers. | `https://quiizee.krisnantobiyuh.workers.dev` |
| `AI_API_KEY` | Optional | Google Gemini API key (`AQ...`) used for AI question generation in production. | `AQ.Ab8RN6KB...` |
| `AI_API_URL` | Optional | Custom Google Generative AI REST endpoint override. | `https://generativelanguage.googleapis.com/...` |
| `AI_MODEL` | Optional | Specific Gemini model identifier to invoke (`gemini-1.5-flash`). | `gemini-1.5-flash` |
