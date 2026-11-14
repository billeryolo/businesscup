# Setup: Supabase + Vercel

About 15 minutes. The free check works without any of this; accounts, saved results and the
progress dashboard need Supabase.

## 1. Create the Supabase project

1. <https://supabase.com/dashboard> → **New project** (free tier). Name it `readbuddy`.
   Region: **East US (North Virginia)**, next to Vercel's default region, so every query is short.
2. **Project Settings → API Keys**: copy the **Project URL** and the **publishable key**
   (`sb_publishable_…`). Both are safe in the browser. Never use the secret key in this app.

## 2. Create the tables

**SQL Editor → New query**, paste all of
[`supabase/migrations/20261104000000_init.sql`](../supabase/migrations/20261104000000_init.sql),
**Run**. It creates `profiles`, `children`, `readings` and `trial_interest`, turns on row-level
security (each parent sees only their own rows), and adds `delete_my_account()`.

## 3. Deploy on Vercel

1. <https://vercel.com/new> → import **billeryolo/businesscup**.
2. **Root Directory**: leave it as the repo root (Framework: Next.js is detected).
3. **Environment Variables** (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — from step 1
   - `ANTHROPIC_API_KEY` — optional, mark it Sensitive; without it the rules write the summary
   - `CONTACT_EMAIL` — optional, shown on the privacy and terms pages
4. **Deploy.** The production branch is `main`, so every merge to it redeploys, and every PR
   gets a preview link.
5. On the free plan, Vercel only builds commits whose author email is linked to your GitHub
   account.

`NEXT_PUBLIC_…` values are built into the page, so after changing them, redeploy.

## 4. Point sign-in links at the site

Supabase → **Authentication → URL Configuration**:

- **Site URL**: your production URL, e.g. `https://readbuddy.vercel.app`
- **Redirect URLs**: add
  - `https://<your-production-domain>/auth/callback`
  - `http://localhost:3000/auth/callback` (local development)
  - `https://*-<your-vercel-account>.vercel.app/**` (preview deployments)

## 5. Email

Sign-in uses one-time links ("magic links"). Supabase's built-in mailer only sends a few emails
per hour, which is fine for testing. Before inviting real parents:

- **Authentication → Emails → SMTP Settings**: connect a sender such as Resend.
- **Authentication → Emails → Templates → Magic Link**: change the subject to
  "Your ReadBuddy sign-in link" so parents recognize it.

## 6. Check it end to end

On a phone and a laptop (Chrome or Safari):

1. Run a check with the microphone, then **Save the result** → email link → dashboard shows it.
2. **Start this week's check** → a new story → the chart gets a second point.
3. Paywall → **Start the 7-day free trial** → a row appears in `trial_interest`.
4. Delete a reading, then delete the account.

`delete_my_account()` deletes the row in `auth.users`, which cascades to everything else. It was
tested on plain Postgres, not on a live Supabase project; if it fails there with a permission
error, tell Claude and it will switch account deletion to a server route.

## Reading the numbers

Supabase → **SQL Editor**:

```sql
-- Interest test: trial clicks by plan and result
select plan, verdict, count(*) from trial_interest group by plan, verdict order by count desc;

-- Accounts, children and readings
select (select count(*) from auth.users) as parents,
       (select count(*) from children) as children,
       (select count(*) from readings) as readings,
       (select count(*) from readings where mode = 'live') as microphone_readings;

-- Children with a weekly re-check (2+ readings)
select count(*) from (select child_id from readings group by child_id having count(*) >= 2) t;
```

## Before charging money

The privacy and terms pages are a starting point written for the free beta. Have them reviewed,
and check the US children's privacy rules (COPPA) with someone qualified, before taking payments
or running ads.
