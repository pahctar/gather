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
5. Database migrations live in `supabase/migrations/`. Run them in order, either by pasting each file into **SQL Editor** or with the Supabase CLI (`supabase link` then `supabase db push`).

Design decisions and inconsistencies are logged in [docs/decisions.md](docs/decisions.md).
