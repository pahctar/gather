# Gather

Plan trips and meetups around friends' availability. Mobile-first web app.

Stack: React + TypeScript + Vite, Tailwind CSS v3, React Router, Supabase (auth, Postgres, RLS).

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two values (see below)
npm run dev                  # http://localhost:5173
npm test                     # unit tests
```

## Supabase setup (one-time)

1. Create a project at https://supabase.com/dashboard (free tier is fine). Pick a region near your users and save the database password somewhere safe. The app doesn't need it.
2. **Project Settings → API**: copy the **Project URL** into `VITE_SUPABASE_URL`, then copy the **anon / publishable** key into `VITE_SUPABASE_ANON_KEY` in `.env.local`. Never use the `service_role` / secret key in the app.
3. **Authentication → Sign In / Providers → Email**:
   - Enable Email provider: **on**
   - Confirm email: **on** (see docs/decisions.md #11)
   - Minimum password length: **8**
   - Password requirements: **No required characters**
   - Leaked password protection: **off** (otherwise some 8+ character passwords get rejected without a clear reason)
4. **Authentication → URL Configuration**: Site URL `http://localhost:5173`. Add `http://localhost:5173/**` to Redirect URLs.
5. **Run the database migrations** (each file in `supabase/migrations/`, oldest first):
   - Open **SQL Editor → New query**, paste the whole file, click **Run**. You should see "Success. No rows returned".
   - Or with the Supabase CLI: `supabase link --project-ref <your-ref>` then `supabase db push`.
   - Check: **Table Editor** shows a `profiles` table, and **Authentication → Policies** lists two policies on it.

### Email limits while testing

Supabase's built-in email service sends only a few emails per hour (about 2 on the free plan). If sign-ups start failing with "Too many attempts. Wait a minute and try again.", either wait, or for local testing turn **Confirm email** off (sign-up then goes straight in), or set up your own SMTP under **Authentication → Emails → SMTP Settings**.

## Tests

```bash
npm test          # unit and page tests (no network)
npm run test:db   # database migrations + row-level security tests (pgTAP)
```

`npm run test:db` needs a local Postgres 15+ with pgTAP (e.g. `brew install postgresql@16 pgtap` on macOS). With Docker and the Supabase CLI you can run `supabase test db` instead.

Design decisions and inconsistencies are logged in [docs/decisions.md](docs/decisions.md).
