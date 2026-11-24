# Job Tracker - Personal HR Recruiter Calling CRM & Application Pipeline

A lightweight, secure, cloud-synchronized HR Calling Tracker and Job Application Management System designed for job seekers. Built with React 18, Vite, Supabase PostgreSQL, and Row Level Security (RLS).

Engineered to run forever at **₹0 total cost** within the permanent free tiers of **Supabase**, **Vercel Hobby**, and **GitHub**.

---

## 🌟 Key Features

1. **Strict Multi-User Data Isolation (RLS)**:
   - Shared database tables with automated PostgreSQL Row Level Security.
   - User A, User B, and User C can use the exact same website with their own credentials.
   - PostgreSQL guarantees that no user can ever view, update, delete, or call another user's contacts—even if frontend code is bypassed.
2. **Simplified Username Login**:
   - Log in using a simple username (e.g. `chetan`, `friend1`, `friend2`) or a standard email address.
   - Automatically maps username to `@jobtracker.app` internally for Supabase Auth.
   - Persistent session with automatic token refresh.
3. **Comprehensive HR Contact Management**:
   - Live search across HR name, company, phone number, and discussion notes.
   - Status tracking: _Not Called_, _No Answer_, _Busy — Call Later_, _Connected_, _Resume Requested_, _Opportunity Shared_, _Interview Scheduled_, _Follow Up Needed_, _Waiting for HR Response_, _Not Hiring_, _Rejected_, _Do Not Contact_.
   - Clickable `tel:` and `mailto:` links with responsive tap targets for mobile phones.
   - Duplicate prevention based on normalized 10-digit phone numbers (`phone_key`).
   - Soft deletion with instant **Undo Toast**, plus a dedicated **Trash** view to restore or permanently delete records.
4. **One-Click Call Logging & Chronological History**:
   - Atomic PostgreSQL RPC transaction (`log_call`) that creates a call log and updates contact status, timestamp, and next follow-up date simultaneously.
   - Full history modal showing all past discussions chronologically (newest first).
5. **Urgent Follow-ups Tracker**:
   - Highlights overdue callbacks in red with `(Overdue by N days)`.
   - Highlights today's follow-ups in amber.
   - Quick reschedule shortcuts (`+1d`, `+3d`, `+1w`).
   - Friendly empty state: `🎉 All caught up! No overdue follow-ups.`
6. **Bulk Add Contacts**:
   - Enter multiple contacts row-by-row or copy-paste tab-separated columns directly from Excel / Google Sheets.
   - Automatically validates rows and skips duplicates.
7. **Job Applications Pipeline**:
   - Track application stage, expected CTC vs offered CTC, interview rounds, recruiter contact, and job posting URLs.
   - Toggle between **Table View** and **Kanban Board**.
8. **100% Reliable Import / Export**:
   - **JSON Backup & Restore**: One-click complete backup of contacts, calls, and applications.
   - **Legacy HTML Tracker Support**: Direct restore of backups from the original `hr_calling_tracker.html` application (`hr-tracker-backup-*.json`).
   - **CSV Export**: Contacts and Applications with UTF-8 BOM encoding for seamless Microsoft Excel compatibility.
   - **Interactive Import Preview**: Shows total, valid, duplicate, and invalid counts, displays first 20 rows, highlights errors, and runs batch inserts in chunks of 200 with an animated progress bar.
   - Download skipped/duplicate rows as CSV.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite 5, React Router 6, Lucide React icons.
- **Styling**: Pure CSS3 matching the crisp `#f4f7fb` light theme, custom responsive tables, and mobile card views.
- **Backend / Database / Auth**: Supabase PostgreSQL + Supabase Auth via `@supabase/supabase-js` v2.
- **Data Interchange**: PapaParse (CSV) + native JSON.
- **Hosting**: Vercel Hobby (Static Vite SPA with `vercel.json` rewrites).

---

## 🚀 Beginner Deployment Guide (Step-by-Step)

Follow these exact steps to set up the project and deploy it for free.

### Step 1: Create a Free Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**, choose an organization, give your project a name (e.g. `job-tracker`), set a secure database password, and select the region nearest to you (e.g., _Central India (Mumbai)_).
3. Click **"Create new project"** and wait ~2 minutes for the database to provision.

### Step 2: Run the Database Schema Migration

1. In your Supabase project dashboard, open the left sidebar and click **"SQL Editor"** (icon with `>_`).
2. Click **"New query"**.
3. Open the file `supabase/schema.sql` from this repository, copy its entire contents, paste them into the SQL Editor, and click **"Run"** (green button).
4. Verify that you see `Success. No rows returned`. All 4 tables (`contacts`, `calls`, `job_applications`, `activities`), indexes, RLS policies, and the `log_call` function are now active.

### Step 3: Configure Authentication Settings & Create Users

1. In the Supabase left sidebar, click **"Authentication"** -> **"Providers"** -> **"Email"**.
2. **Turn OFF** "Allow new users to sign up" (disables public signups so only authorized users can log in).
3. **Turn OFF** "Confirm email" (allows users to log in immediately without waiting for verification emails).
4. Click **"Save"**.
5. In the Authentication sidebar, click **"Users"** -> **"Add user"** -> **"Create new user"**.
6. Create your 3 user accounts with their usernames mapped to `@jobtracker.app`:
   - User 1: `chetan@jobtracker.app` + choose a strong password. (Toggle "Auto Confirm User?" to ON).
   - User 2: `friend1@jobtracker.app` + choose a strong password. (Auto Confirm ON).
   - User 3: `friend2@jobtracker.app` + choose a strong password. (Auto Confirm ON).
7. _Note:_ When logging into the app, users only type their username (e.g. `chetan`) and password!

### Step 4: Get Your Supabase API Keys

1. In Supabase, go to **"Project Settings"** (gear icon) -> **"API"**.
2. Copy the **Project URL** (e.g. `https://xyzcompany.supabase.co`).
3. Copy the **anon / public key** (the long string under _Project API keys_).
4. _Important:_ Never use or expose the `service_role` key. The frontend only uses the `anon` public key protected by PostgreSQL RLS.

### Step 5: Test Locally

1. In your terminal, navigate to the `job-tracker` folder:
   ```bash
   cd /Users/chetanramshelke/Documents/React_Project/job-tracker
   ```
2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your keys:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Install dependencies and start the local development server:
   ```bash
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.
6. Log in with `chetan` and the password you set in Step 3.

### Step 6: Push to GitHub & Deploy on Vercel

1. Initialize git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Job Tracker CRM"
   ```
2. Create a new repository on [github.com](https://github.com) named `job-tracker` (set it to Private).
3. Link and push your local repository:
   ```bash
   git remote add origin https://github.com/<your-username>/job-tracker.git
   git branch -M main
   git push -u origin main
   ```
4. Go to [vercel.com](https://vercel.com) and log in with GitHub.
5. Click **"Add New..."** -> **"Project"** and click **"Import"** next to `job-tracker`.
6. In the configuration screen, expand **"Environment Variables"** and add:
   - `VITE_SUPABASE_URL`: (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (your Supabase Anon Key)
7. Click **"Deploy"**. Vercel will build and deploy the app in under 1 minute.
8. Go back to Supabase -> **Authentication** -> **URL Configuration** -> Add your Vercel URL (e.g. `https://job-tracker-xyz.vercel.app`) to **Site URL** and **Redirect URLs**.

---

## ⚠️ Free-Tier Guidelines & Warnings

1. **Supabase Inactivity Pause**:
   - Supabase free-tier projects pause automatically after **1 week of total database inactivity**.
   - If paused, simply log into the Supabase Dashboard and click **"Restore Project"** (takes ~1 minute with zero data loss). Logging into the app once a week keeps it permanently active.
2. **Weekly Backups**:
   - The Supabase free plan does not include automated daily point-in-time recovery.
   - Go to **Import / Export** -> **Complete JSON Backup** once a week to download a full local snapshot of your contacts, call logs, and applications.
3. **Vercel Hobby Plan**:
   - The Vercel Hobby plan is free for personal use and provides 100 GB/month bandwidth, which is more than enough for three active users.

---

## ✅ Quality Assurance & Verification Checklist

- [x] **Tenant Isolation**: Log in as `chetan`, create contacts, log out, log in as `friend1`. Confirm that `friend1` sees 0 of `chetan`'s contacts.
- [x] **RLS Enforcement**: Verify in PostgreSQL that running `select * from contacts` under an authenticated JWT returns only rows where `user_id = auth.uid()`.
- [x] **Duplicate Phone Check**: Add a contact with phone `9876543210`. Try adding another contact with `+91 98765 43210`. Verify the user receives a friendly alert: `⚠️ Already saved as [Name] ([Company])`.
- [x] **Atomic Call Logging**: Click "Call", select an outcome, enter notes, and submit. Verify that the call log is saved in `calls` and that the contact's `status`, `last_call_at`, and `followup_date` update atomically.
- [x] **Soft Delete & Undo**: Click delete on a contact. Confirm that an Undo toast appears and that clicking "Undo" restores the record immediately. Verify deleted contacts appear in `/trash`.
- [x] **Legacy JSON Backup Import**: Upload an old `hr-tracker-backup-*.json` file. Verify that the preview modal maps old IDs to new UUIDs and displays all valid, duplicate, and invalid rows.
- [x] **Excel CSV Compatibility**: Export contacts CSV and open in Microsoft Excel. Verify that the UTF-8 BOM prevents encoding corruption.
- [x] **Mobile Responsiveness**: Open on a mobile device or inspect in Chrome DevTools. Confirm that tables switch to mobile cards, tap targets are touch-friendly (≥ 44px), and `tel:` links trigger phone dialing.

---

## 📁 Repository File Structure

```text
job-tracker/
├── index.html                           # App HTML template with favicon
├── package.json                         # Dependencies & npm scripts
├── vite.config.js                       # Vite build configuration with chunking
├── vercel.json                          # Vercel SPA routing rewrites
├── .env.example                         # Example environment variables
├── .gitignore                           # Git ignore patterns
├── README.md                            # Complete documentation & deployment guide
├── supabase/
│   ├── schema.sql                       # Complete SQL migration with RLS & functions
│   └── migrations/
│       └── 20240101000000_init.sql      # Supabase CLI compatible migration
└── src/
    ├── main.jsx                         # React entry point with BrowserRouter
    ├── App.jsx                          # App route definitions & providers
    ├── styles.css                       # Light CRM styling & responsive layout
    ├── lib/
    │   ├── supabase.js                  # Supabase client & friendly error formatting
    │   ├── constants.js                 # Statuses, outcomes, actions & color palettes
    │   ├── dates.js                     # Date formatting, overdue & timezone helpers
    │   ├── csv.js                       # CSV export with UTF-8 BOM & template generators
    │   └── importer.js                  # CSV/JSON parser, old backup normalizer & chunker
    ├── context/
    │   ├── AuthContext.jsx              # Supabase Auth, username mapping & session state
    │   └── ContactsContext.jsx          # Real-time state, optimistic CRUD, RPC calling & toast
    ├── components/
    │   ├── layout/
    │   │   └── Navbar.jsx               # Navigation bar, sync status & mobile menu
    │   ├── common/
    │   │   ├── ProtectedRoute.jsx       # Route guard with session loader
    │   │   ├── StatusBadge.jsx          # Color-coded status badge
    │   │   └── Toast.jsx                # Toast notifications with Undo support
    │   ├── contacts/
    │   │   ├── ContactModal.jsx         # Add/Edit HR contact modal with duplicate check
    │   │   └── BulkModal.jsx            # Spreadsheet bulk add & Excel paste modal
    │   ├── calls/
    │   │   ├── CallModal.jsx            # Log call modal with RPC integration
    │   │   └── HistoryModal.jsx         # Chronological call history modal
    │   ├── applications/
    │   │   └── ApplicationModal.jsx     # Add/Edit job application modal
    │   └── import/
    │       └── ImportPreview.jsx        # Chunked import preview with progress bar
    └── pages/
        ├── Login.jsx                    # Username/password login & reset modal
        ├── Dashboard.jsx                # Metric cards, urgent follow-ups & recent calls
        ├── Contacts.jsx                 # HR directory, live search, filters & actions
        ├── FollowUps.jsx                # Follow-up tracker with overdue alerts & reschedule
        ├── Applications.jsx             # Job applications table & Kanban pipeline
        ├── ImportExport.jsx             # Backup export & legacy restore center
        └── Trash.jsx                    # Soft-deleted records restoration & purge
```

---

## 🔒 Security Summary

- **Row Level Security (RLS)** is enabled on all PostgreSQL tables.
- All database policies evaluate `auth.uid() = user_id`.
- The frontend client uses only the public `anon` key.
- The `user_id` column defaults to `auth.uid()`.
- Unique constraint `(user_id, phone_key)` prevents accidental duplicates per user without interfering with other users' contacts.
