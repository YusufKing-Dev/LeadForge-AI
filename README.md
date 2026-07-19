# LeadForge AI

Personal dashboard for finding and tracking web design leads.

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase
   Project URL and Publishable key (Supabase dashboard → Settings → API Keys).
3. Run the dev server:
   ```
   npm run dev
   ```
4. Visit `http://localhost:3000` — you'll be redirected to `/login`.
   Sign in with the user you created in Supabase Authentication → Users.

## Deploying

1. Push this repo to GitHub.
2. Import the repo on [vercel.com](https://vercel.com).
3. In Vercel's project settings, add the same two environment variables
   from `.env.local` (Settings → Environment Variables).
4. Deploy. Every push to `main` will auto-deploy after this.

## What's here

- `/app/login` — email/password sign-in
- `/app/dashboard` — leads table, add-lead form, status tracking
- `/lib` — Supabase client setup (browser + server)
- `middleware.ts` — redirects signed-out users to `/login` and keeps
  the session refreshed
