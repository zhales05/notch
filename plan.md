# Notch Web — Build Plan

Each stage is a self-contained, testable unit. Don't start stage N+1 until stage N passes its verification checklist.

---

## Stage 0: Project Bootstrap

**Goal:** Next.js app boots locally, connects to Supabase, Tailwind + shadcn working.

- [x] Initialize Next.js 14 (App Router, TypeScript, Tailwind) inside `notch-web/`
- [x] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `recharts`, `shadcn/ui`
- [x] Configure Supabase client (browser + server) in `lib/supabase/`
- [x] Add environment variables template (`.env.local.example`)
- [x] Set up Supabase CLI for local dev (`supabase init`)

**Verify:**

- `npm run dev` starts without errors
- Supabase client initializes (console log confirms connection)
- A shadcn `<Button>` renders with Tailwind styles on the index page

---

## Stage 1: Database Schema + RLS

**Goal:** All core tables exist with row-level security enforced. Goal progress function works.

- [x] Migration 001: `profiles` table + auth trigger for auto-creation
- [x] Migration 002: `categories` table + RLS
- [x] Migration 003: `habits` table + RLS
- [x] Migration 004: `habit_logs` table + RLS
- [x] Migration 005: `goals` table + RLS
- [x] Migration 006: `goal_habits` join table + RLS
- [x] Migration 007: `calculate_goal_progress(goal_id)` Postgres function
  - Handles `contribution_mode`: `count` (count of logs), `value_sum` (sum of log values), `streak` (current streak length)
  - Returns `{ current_value, target_value, percentage }`
  - Respects `weight` field for multi-habit goals
- [x] Migration 008: `check_habit_limit()` function + trigger for freemium enforcement
- [x] Seed data script for local development

**Verify:**

- `supabase db reset` runs all migrations cleanly
- Insert test data via SQL: 2 users, each with habits, logs, goals
- Confirm RLS: user A cannot read user B's data
- Call `calculate_goal_progress()` with test data — returns correct values for each `contribution_mode`
- Free-tier user blocked from creating 5th habit at DB level

---

## Stage 2: Auth

**Goal:** Users can sign up, log in, log out. Sessions persist across refreshes.

- [x] Auth layout group `(auth)/` with `/login` and `/signup` pages
- [x] Email/password sign up via `supabase.auth.signUp()`
- [x] Email/password login + magic link option
- [x] Next.js middleware: redirect unauthenticated users to `/login`
- [x] Middleware: redirect authenticated users away from `/login` to `/today`
- [x] Sign out button that clears session
- [x] Confirm `profiles` row created automatically on sign up (auth trigger)

**Verify:**

- Sign up with email → confirmation email received (or auto-confirm in local dev)
- Log in → redirected to `/today`
- Refresh page → still logged in
- Log out → redirected to `/login`
- Visit `/today` while logged out → redirected to `/login`
- Check `profiles` table — row exists with correct `user_id`

---

## Stage 3: Layout Shell + Navigation

**Goal:** App has a sidebar, responsive layout, and all page routes (stubbed).

- [x] Dashboard layout group `(dashboard)/` with shared `layout.tsx`
- [x] Sidebar component: nav links for Today, Habits, Categories, Goals, Analytics, Settings
- [x] Active state on current route
- [x] Mobile-responsive: sidebar collapses to hamburger menu on small screens
- [x] Stub pages for all 6 routes (just a heading per page)

**Verify:**

- Navigate between all 6 pages via sidebar
- Sidebar highlights correct active link
- Resize browser to mobile width — sidebar collapses, hamburger works
- Direct URL navigation works (e.g. `/analytics` loads correct page)

---

## Stage 4: Categories CRUD

**Goal:** Users can create, edit, and delete categories. Required before habits (FK dependency).

- [ ] Categories list page with color/icon display
- [ ] Create category form: title, color picker, icon picker
- [ ] Edit category (inline or modal)
- [ ] Delete category (with confirmation — block if habits exist under it)
- [ ] Custom hook: `useCategories()` — fetch, create, update, delete
- [ ] Empty state when no categories exist

**Verify:**

- Create 3 categories with different colors/icons
- Edit a category name — change persists on refresh
- Delete a category with no habits — succeeds
- Attempt to delete a category with habits — blocked with message
- Log out, log in as different user — see no categories (RLS)

---

## Stage 5: Habits CRUD

**Goal:** Users can create, edit, and archive habits. Grouped by category.

- [ ] Habits list page, grouped by category
- [ ] Create habit form: title, description, category (dropdown), log type (boolean/value), frequency, color, icon
- [ ] Edit habit (modal or dedicated page)
- [ ] Archive habit (soft delete via `archived_at`)
- [ ] Toggle to show/hide archived habits
- [ ] Custom hook: `useHabits()` — fetch, create, update, archive
- [ ] Freemium gate: free users see "Upgrade" prompt when at 4 habits

**Verify:**

- Create habits across multiple categories — they appear grouped correctly
- Edit a habit's category — it moves to the new group
- Archive a habit — it disappears from the default view
- Toggle "show archived" — archived habit reappears (greyed out)
- Create 4 habits on free plan → 5th attempt shows upgrade prompt
- Refresh page — all data persists

---

## Stage 6: Today Page (Daily Logging)

**Goal:** Users can log habits for today. This is the core interaction loop.

- [ ] List of active habits for today, based on frequency
- [ ] Boolean habits: tap to toggle complete/incomplete
- [ ] Value habits: input field to enter a number
- [ ] Optimistic UI updates (toggle feels instant, syncs in background)
- [ ] Completion ring/progress indicator (X of Y habits done today)
- [ ] Category breakdown: mini progress bars per category
- [ ] Week-at-a-glance bar chart (last 7 days completion %)
- [ ] Date selector to log for past days
- [ ] Custom hook: `useLogs()` — fetch, create, delete for a given date

**Verify:**

- Toggle a boolean habit → ring updates immediately, data persists on refresh
- Enter a value for a value-type habit → saved correctly
- Switch to yesterday via date selector → see different completion state
- Log a habit, check `habit_logs` table — row exists with correct `source: 'web'`
- Fast toggle (tap on/off/on quickly) — no duplicate logs, no race conditions

---

## Stage 7: Goals + Progress Tracking

**Goal:** Users can create goals linked to habits/categories. Progress auto-calculates from logs.

- [ ] Goals list page with status badges (active, completed, paused, abandoned)
- [ ] Create goal form: title, description, category, target value, unit, start/end date
- [ ] Link habits to goal via `goal_habits` (select habits, choose contribution mode + weight)
- [ ] Progress bar powered by `calculate_goal_progress()` RPC call
- [ ] Update goal status manually (pause, abandon, complete)
- [ ] Goal detail view showing linked habits and their individual contributions
- [ ] Custom hook: `useGoals()` — fetch, create, update, delete + progress

**Verify:**

- Create a goal: "Run 50 miles this month" → link to running habit with `value_sum` mode
- Log runs on the Today page → goal progress bar updates automatically
- Create a goal with `count` mode → progress increments by 1 per log
- Create a multi-habit goal with weights → weighted progress calculates correctly
- Pause a goal → status badge updates, progress stops counting
- Delete a goal → removed from list, `goal_habits` rows cleaned up

---

## Stage 8: Analytics

**Goal:** Per-habit and per-category analytics with charts.

- [ ] Habit selector pills (pick which habit to analyze)
- [ ] 91-day heatmap (calendar grid, color intensity = completion)
- [ ] Weekly trend line (last 12 weeks)
- [ ] Monthly bar chart (last 6 months)
- [ ] Stat cards: current streak, best streak, 30-day completion rate, total logs
- [ ] Category-level view: aggregate completion rate per category
- [ ] Fixed date range views: 30d / 90d / all time toggle
- [ ] Custom hooks: `useHabitStats()`, `useCategoryStats()`

**Verify:**

- Select a habit with logged data → all charts render with correct values
- Switch habits → charts update
- Toggle 30d / 90d / all time → data range changes
- Habit with no logs → charts show empty state, not errors
- Category view → completion rate matches manual calculation
- Heatmap squares are clickable/hoverable with tooltips showing date + value

---

## Stage 9: Settings + Freemium Polish

**Goal:** Minimal settings page. Freemium limits enforced everywhere.

- [ ] Settings page: display name, email (read-only), sign out button
- [ ] Plan indicator (free / premium) — premium has no purchase flow yet, just a visual
- [ ] Freemium enforcement audit:
  - 4 habit limit (DB trigger + UI gate)
  - 2 category limit (DB trigger + UI gate)
  - Goals blocked on free (UI gate + RLS)
  - Analytics limited to 30 days on free
- [ ] "Upgrade" prompts at each gate point (placeholder — no Stripe)

**Verify:**

- Free user hits every limit — sees upgrade prompt, cannot bypass
- Manually set `profiles.plan = 'premium'` in DB → all limits removed
- Settings page shows correct user info
- Sign out from settings → redirected to login

---

## Stage 10: Polish + Deploy

**Goal:** Production-ready. Deployed to Vercel at notchhabits.com.

- [x] Loading skeletons for all data-fetching pages
- [x] Error boundaries with user-friendly messages
- [x] Empty states for every list (habits, categories, goals, logs)
- [x] Mobile responsiveness pass on all pages
- [x] Favicon, meta tags, OG image
- [ ] Environment variables configured on Vercel (use hosted Supabase project, not local)
- [x] Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` — only use server-side if needed
- [x] Set `NEXT_PUBLIC_SITE_URL` to production domain for magic link redirects
- [x] Add security headers in `next.config.mjs` (X-Frame-Options, CSP, X-Content-Type-Options)
- [ ] Vercel deployment from GitHub main branch
- [ ] Smoke test on production: sign up → create category → create habit → log → check analytics → create goal → verify progress

**Verify:**

- App loads at notchhabits.com
- Full user flow works end-to-end on desktop Chrome
- Full user flow works on mobile Safari
- Magic link email points to production URL, not localhost
- Security headers present in response (check via browser DevTools → Network tab)
- No console errors in production build
- Lighthouse score: Performance > 80, Accessibility > 90

## Stage 11 - deploy

- db password XVwL+nx5Rc.JWyc

---

## Post-v1 (documented, not planned)

- AI notifications + weekly reflection (Claude API)
- React Native app (shares Supabase backend)
- WatchOS app
- HealthKit auto-logging
- CSV data export
- Milestones
- Stripe premium upgrade flow
- **Auth hardening:** email confirmations, stronger password requirements, secure password change (re-auth), session timeouts (24h/8h idle), refresh token reuse interval reduction, error message audit for user enumeration
