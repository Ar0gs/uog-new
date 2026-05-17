# Union of Genius — Supabase Setup Guide

Follow these steps **once** after creating your Supabase project.
Everything is copy-paste — no coding required.

---

## STEP 1 — Get Your Keys

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **Settings** (gear icon) → **API**
3. Copy these three values:
   - **Project URL** → looks like `https://abcxyz.supabase.co`
   - **anon / public** key → long string starting with `eyJ...`
   - **service_role** key → another long string starting with `eyJ...`

4. Open **`js/db.js`** and paste them in lines 8–12:

```js
const SUPABASE_URL         = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY    = 'eyJ...your anon key...';
const SUPABASE_SERVICE_KEY = 'eyJ...your service_role key...';
```

---

## STEP 2 — Create Tables + Policies (copy ALL of this SQL)

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste the **entire block below** and click **Run**

```sql
-- ============================================================
-- UNION OF GENIUS — Complete Database Setup
-- Run this once in Supabase SQL Editor
-- ============================================================

-- ── 1. REGISTRATIONS ────────────────────────────────────────
create table if not exists registrations (
  id           bigint generated always as identity primary key,
  created_at   timestamptz default now() not null,
  first_name   text not null,
  last_name    text not null,
  email        text not null,
  phone        text,
  organization text,
  state        text,
  event        text,
  experience   text,
  motivation   text,
  newsletter   boolean default false
);

-- Allow anyone to insert (public registration form)
alter table registrations enable row level security;

drop policy if exists "Anyone can register" on registrations;
create policy "Anyone can register"
  on registrations for insert
  to anon, authenticated
  with check (true);

-- Only service_role (admin) can read/delete
drop policy if exists "Admin reads registrations" on registrations;
create policy "Admin reads registrations"
  on registrations for select
  to service_role
  using (true);

drop policy if exists "Admin deletes registrations" on registrations;
create policy "Admin deletes registrations"
  on registrations for delete
  to service_role
  using (true);


-- ── 2. CONTACTS ─────────────────────────────────────────────
create table if not exists contacts (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now() not null,
  name       text not null,
  email      text not null,
  subject    text,
  message    text
);

alter table contacts enable row level security;

drop policy if exists "Anyone can contact" on contacts;
create policy "Anyone can contact"
  on contacts for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admin reads contacts" on contacts;
create policy "Admin reads contacts"
  on contacts for select
  to service_role
  using (true);

drop policy if exists "Admin deletes contacts" on contacts;
create policy "Admin deletes contacts"
  on contacts for delete
  to service_role
  using (true);


-- ── 3. BLOGS ────────────────────────────────────────────────
create table if not exists blogs (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now() not null,
  title      text not null,
  category   text,
  author     text,
  excerpt    text,
  content    text,
  emoji      text default '📝',
  bg_color   text,
  status     text default 'live' check (status in ('live','draft'))
);

alter table blogs enable row level security;

-- Public can read live posts (for the website blog page)
drop policy if exists "Anyone reads live blogs" on blogs;
create policy "Anyone reads live blogs"
  on blogs for select
  to anon, authenticated
  using (status = 'live');

-- Admin can do everything
drop policy if exists "Admin manages blogs" on blogs;
create policy "Admin manages blogs"
  on blogs for all
  to service_role
  using (true)
  with check (true);


-- ── 4. SUBSCRIBERS ──────────────────────────────────────────
create table if not exists subscribers (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now() not null,
  name       text,
  email      text not null,
  source     text default 'Direct Signup'
);

alter table subscribers enable row level security;

drop policy if exists "Anyone can subscribe" on subscribers;
create policy "Anyone can subscribe"
  on subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admin reads subscribers" on subscribers;
create policy "Admin reads subscribers"
  on subscribers for select
  to service_role
  using (true);

drop policy if exists "Admin deletes subscribers" on subscribers;
create policy "Admin deletes subscribers"
  on subscribers for delete
  to service_role
  using (true);


-- ── DONE ────────────────────────────────────────────────────
-- You should see "Success. No rows returned" — that is correct.
```

> ✅ You should see: **"Success. No rows returned"**
> This is correct — it means all tables and policies were created.

---

## STEP 3 — Verify It Works

1. Open your deployed site (or `index.html` locally)
2. Open the browser **Developer Tools → Console** (F12)
3. Type this and press Enter:

```js
sbSelfTest()
```

You should see green checkmarks for all 4 tables. If you see red errors, the message will tell you exactly what's wrong.

---

## STEP 4 — Deploy to Vercel

1. Push your project to GitHub (make sure `js/db.js` with your keys is included)
2. Import the repo in Vercel — no build settings needed, it's a static site
3. Done! All data now flows through Supabase and is visible on any device.

---

## Common Problems & Fixes

| Error | Fix |
|-------|-----|
| `401 Unauthorised` | Wrong key pasted in `js/db.js` — re-copy from Supabase Settings → API |
| `403 Forbidden / RLS` | Run the SQL in Step 2 again — a policy is missing |
| `404 Not Found` | Table doesn't exist — run the `create table` SQL in Step 2 |
| Admin dashboard shows 0 rows | You're using the anon key in admin — make sure `service_role` key is in `js/db.js` |
| Blog posts not showing on site | Check the blog `status` is `live`, not `draft` |
| `UOG_DB_ERROR: keys not set` | You haven't pasted your keys into `js/db.js` yet |

---

## Security Notes

- The **anon key** is safe to ship in your HTML — Supabase RLS policies
  ensure anonymous users can only INSERT (not read) sensitive tables.
- The **service_role key** bypasses RLS. Keep `admin.html` access private
  (password-protect it, or restrict by IP in Vercel).
- Never commit real keys to a public GitHub repo. Use Vercel Environment
  Variables if you want to keep keys out of your source code.

