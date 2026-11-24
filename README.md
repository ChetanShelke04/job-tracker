# 📱 Job Tracker — Modern SaaS Calling CRM & Job Application Pipeline

A high-performance, lightweight, multi-tenant recruiter calling CRM and job hunt pipeline designed for candidates, job seekers, and recruiters. Built with **React 18**, **Vite 5**, **React Router 6**, **Pure CSS3** (Linear & Notion inspired), and **Supabase PostgreSQL** with **Row Level Security (RLS)**.

Engineered to operate at **₹0 / $0 total cost forever** within the permanent free tiers of **Supabase**, **Vercel Hobby**, and **GitHub**.

---

## 📑 Table of Contents

1. [Overview & Design Philosophy](#-overview--design-philosophy)
2. [Architecture & How It Works](#-architecture--how-it-works)
3. [Complete Step-by-Step Feature Walkthrough](#-complete-step-by-step-feature-walkthrough)
   - [1. Authentication & Username Login](#1-authentication--simplified-username-login)
   - [2. App Layout, Navigation & Mobile UX](#2-modern-app-layout--mobile-ux)
   - [3. Dashboard Screen](#3-dashboard-screen)
   - [4. HR Contacts Directory](#4-hr-contacts-directory)
   - [5. One-Click Call Logging & Call History](#5-one-click-call-logging--history)
   - [6. Follow-ups Management & Quick Reschedule](#6-follow-ups-management--quick-reschedule)
   - [7. Job Applications Pipeline (Table & Kanban)](#7-job-applications-pipeline)
   - [8. Import / Export & Legacy Restore Center](#8-import--export-data-center)
   - [9. Trash & Data Recovery](#9-trash--data-recovery)
4. [Step-by-Step Installation & Setup Guide](#-step-by-step-installation--setup-guide)
   - [Prerequisites](#prerequisites)
   - [Step 1: Clone Repository & Install Dependencies](#step-1-clone-repository--install-dependencies)
   - [Step 2: Create a Free Supabase Project](#step-2-create-a-free-supabase-project)
   - [Step 3: Run Database Schema & Security Grants](#step-3-run-database-schema--security-grants)
   - [Step 4: Configure Supabase Authentication & Create Accounts](#step-4-configure-supabase-authentication--create-accounts)
   - [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
   - [Step 6: Run Locally](#step-6-run-locally)
   - [Step 7: Deploy on Vercel ($0 / Free Forever)](#step-7-deploy-on-vercel-0--free-forever)
5. [Database Schema & Security Deep Dive](#-database-schema--security-deep-dive)
   - [Database Tables & Relationships](#database-tables)
   - [Row Level Security (RLS) Explanation](#row-level-security-rls)
   - [Atomic RPC Function: `log_call`](#atomic-rpc-function-log_call)
   - [Phone Normalization & Deduplication Logic](#phone-normalization--deduplication-logic)
6. [Import & Export Format Specifications](#-import--export-format-specifications)
7. [Troubleshooting & Frequently Asked Questions](#-troubleshooting--faq)
8. [File Structure](#-file-structure)

---

## 🎯 Overview & Design Philosophy

The **Job Tracker** is built to solve the chaos of job searching. Instead of messy spreadsheets or clunky enterprise CRMs, it delivers:

- **SaaS-Grade UI**: Clean white & slate-gray surfaces, vibrant blue accent colors, soft borders, subtle shadows, and crisp Inter typography inspired by **Linear** and **Notion**.
- **Handy Mobile First Experience**: Native feel on iPhone, Android, and tablets. Features minimum **44px touch targets**, sticky topbar, one-tap phone dialing pills (`tel:`), floating action bottom nav, and automatic table-to-card conversions with zero horizontal scrolling.
- **Strict Privacy & Isolation**: Multi-tenant database architecture where multiple users (e.g. you and your friends) share the same Supabase database and URL, but PostgreSQL **Row Level Security (RLS)** strictly prevents anyone from accessing another user's contacts or applications.
- **Ultra-Lightweight & Blazing Fast**: Pure CSS3 styling (total CSS bundle is only **~21 kB** / **~4.9 kB gzipped**), zero heavy component libraries, and build times under **1.5 seconds**.

---

## 🏗️ Architecture & How It Works

```
┌────────────────────────────────────────────────────────────────┐
│                       Client Browser                           │
│  (React 18 SPA + Vite 5 + Pure CSS3 + Lucide Icons)           │
│                                                                │
│  • AuthContext: Maps "username" -> "username@jobtracker.app"   │
│  • ContactsContext: Optimistic updates + Toast Notifications   │
│  • AppLayout: Responsive Sidebar + Mobile Topbar + Bottom Nav  │
└───────────────────────────────┬────────────────────────────────┘
                                │ JWT Authentication & REST/RPC
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                   Supabase Cloud Platform                      │
│                                                                │
│  ┌──────────────────┐               ┌───────────────────────┐  │
│  │  Supabase Auth   │──────────────▶│ PostgREST Data Engine │  │
│  │ (Session Tokens) │               │   (Port 443 HTTPS)    │  │
│  └──────────────────┘               └───────────┬───────────┘  │
│                                                 │              │
│  ┌──────────────────────────────────────────────▼───────────┐  │
│  │              PostgreSQL 15+ Database Engine              │  │
│  │                                                          │  │
│  │  • Row Level Security (RLS): auth.uid() = user_id        │  │
│  │  • Contacts Table (Unique: user_id + phone_key)          │  │
│  │  • Calls Table (Linked to Contact & User)                │  │
│  │  • Job Applications Table (Pipeline & CTC Tracking)      │  │
│  │  • RPC Function: log_call() (Atomic Status + Followup)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Complete Step-by-Step Feature Walkthrough

### 1. Production Authentication & Role-Based Access Control

- **Username OR Email Login**: Users can sign in using either their chosen unique username (e.g., `chetan`) or their registered email address (`chetan@gmail.com`).
  - Username resolution is performed securely via a PostgreSQL stored procedure (`public.get_login_email`) without exposing unrestricted public table queries or enabling account enumeration.
- **Dedicated Registration**:
  - Fields: Full Name, Unique Username, Real Email Address, Password, Confirm Password, and Account Type (`User` / `HR`).
  - Real-time username availability detection with debounced backend verification (`public.check_username_available`).
  - Interactive password strength meter (Weak / Moderate / Strong).
- **Email Verification Workflow**:
  - Full email confirmation lifecycle via Supabase Auth (`/verify-email`).
  - Rate-limited resend confirmation link functionality with a 60-second cooldown timer.
  - Protected routes strictly guard against unverified email access.
- **Password Recovery & Reset**:
  - Forgot password request page (`/forgot-password`) with rate-limiting and anti-enumeration generic responses.
  - Secure reset password callback page (`/reset-password`) with password strength checks.
- **In-App Password Change**:
  - Inside Settings (`/settings`), authenticated users can update their password after re-verifying their current password.
- **Role-Based Authorization (User vs HR)**:
  - **User (Job Seeker)**: Focused on personal job applications (`/applications`), interview scheduling, and application status tracking.
  - **HR (Recruiter)**: Full access to HR recruiter calling directory (`/contacts`), call history (`calls`), callbacks (`/follow-ups`), and bulk imports.
  - Role separation is enforced at the database layer via PostgreSQL Row Level Security (RLS) on `public.contacts` and `public.profiles`.
- **Session Persistence & Synchronization**:
  - Sessions automatically refresh via Supabase GoTrue tokens.
  - Changes across multiple browser tabs stay synchronized in real time via `onAuthStateChange`.

---

### 2. Modern App Layout & Mobile UX

- **Desktop Sidebar (Screens ≥ 1024px)**:
  - Sticky left sidebar (width: 240px).
  - Clean brand lockup with blue gradient phone icon and "Job Tracker" title (no bulky subtitles).
  - Workspace navigation links with active indicators and real-time badge counters (e.g. total contacts count, overdue count).
  - Cloud sync indicator: Shows live synchronization status (**Syncing…**, **All changes saved**, **Cloud connected**, or **Sync error**).
  - Quick sign-out button.
- **Mobile Navigation (Screens < 1024px)**:
  - **Sticky Topbar (54px)**: Fixed at top of the viewport with brand icon, current page pill, and menu drawer toggle.
  - **Native Bottom Navigation Bar**: Fixed at the bottom with iOS safe-area inset support (`env(safe-area-inset-bottom)`). Houses 5 touch-friendly tabs:
    1. **Dashboard** (`/`)
    2. **Contacts** (`/contacts`)
    3. **Follow-ups** (`/follow-ups` with red badge if any are overdue)
    4. **Pipeline** (`/applications`)
    5. **More** (opens drawer for Import/Export, Trash, and Account logout)
  - **Single Header Slide Drawer**: Opens smoothly from the left without duplicate header stacking.
  - **Zero Horizontal Scroll**: All flexboxes and CSS grids clamp to device width (`min(100%, 340px)`).
  - **iOS Zoom Prevention**: Form inputs use 16px font on mobile so Safari never forces an unnatural auto-zoom when typing.

---

### 3. Dashboard Screen

- **5 High-Impact Metric Cards**:
  1. **Total HR Contacts**: Blue accent bar. Total active recruiters in directory.
  2. **Calls Made**: Green accent bar. Total outreach calls recorded.
  3. **Today's Follow-ups**: Amber accent bar. Scheduled callbacks due today.
  4. **Overdue Follow-ups**: Red accent bar. Callbacks that were missed or overdue.
  5. **Active Applications**: Purple accent bar. Job opportunities currently in interview stages.
- **Urgent & Upcoming Follow-ups Section**: Shows overdue callbacks first with an alert icon, recruiter name, company, clickable phone pill, and quick "Log Call" button.
- **Recent Call Activities Section**: Displays the latest calls made, conversation outcomes (_Connected_, _Busy_, _Resume Requested_), and brief notes.
- **Quick Action Bar**: Buttons for **Bulk Add** and **Add Contact**.

---

### 4. HR Contacts Directory

- **Instant Live Search**: Filters contacts instantaneously across Name, Company, Phone number, and Discussion notes without reloading.
- **Category Filter Chips**: Filter contacts by status pills (_All_, _Not Called_, _Connected_, _Resume Requested_, _Interview Scheduled_, etc.).
- **Clickable Call Pills**: Phone numbers are wrapped in styled touch pills (`tel:`) that open mobile dialers directly on phones.
- **Duplicate Phone Detection**:
  - Automatically extracts the rightmost 10 digits (`phone_key`).
  - When typing a phone number in the contact modal, the system instantly alerts if the number is already saved as another contact.
  - Enforced at both the React state level and the PostgreSQL database level (`UNIQUE(user_id, phone_key)`).
- **Soft Deletion with Instant Undo**:
  - Deleting a contact moves it to Trash with a `deleted_at` timestamp.
  - An interactive Toast alert appears for 4.5 seconds with an **Undo** button.
  - Clicking "Undo" immediately restores the contact to its original position.
- **Mobile Card Stack**: Tables automatically convert to clean mobile cards on screens `< 768px`.

---

### 5. One-Click Call Logging & History

- **Atomic Call Logging**:
  - Clicking **Log Call** opens a focused dialog.
  - Select Call Outcome (_Connected_, _Busy — Call Later_, _No Answer_, _Resume Requested_, _Interview Scheduled_, etc.).
  - Set a **Next Follow-up Date**.
  - Enter **Discussion Notes**.
  - Calls PostgreSQL stored function `public.log_call(...)`, which atomically:
    1. Inserts a new record into `calls`.
    2. Updates the contact's `status` to the outcome.
    3. Updates `last_call_at` to `NOW()`.
    4. Updates `followup_date`.
- **Chronological Call History Modal**:
  - Click the history icon on any contact to view all past conversations with timestamps and notes, sorted newest to oldest.

---

### 6. Follow-ups Management & Quick Reschedule

- **Dedicated Follow-up Views**: Tabbed filters for **Overdue**, **Today**, **Upcoming**, and **All**.
- **Overdue Badges**: Clear visual warnings with days overdue (`Overdue by 3 days`).
- **1-Click Reschedule Shortcuts**:
  - `+1d` (Push to tomorrow)
  - `+3d` (Push by 3 days)
  - `+1w` (Push by 1 week)
- **Empty State Celebration**: Displays `🎉 All caught up! No overdue follow-ups` when all tasks are complete.

---

### 7. Job Applications Pipeline

- **Detailed Tracking**: Track Company Name, Job Title, Job Location, Job URL, Application Date, Expected CTC, Offered CTC, Status, Recruiter Details, and Notes.
- **Dual Visual Modes**:
  - **Table View**: Compact, sortable spreadsheet style.
  - **Kanban Board**: Drag-and-drop / stage columns (_Applied_, _Screening_, _Interviewing_, _Offered_, _Rejected_, _Withdrawn_).

---

### 8. Import & Export Data Center

- **Complete JSON Backup**:
  - One-click export of your entire database (Contacts, Calls, Applications) into a clean, portable `.json` file.
  - Includes schema versioning and timestamps.
- **Excel-Compatible CSV Export**:
  - Contacts and Job Applications exported with **UTF-8 BOM** (`\uFEFF`), ensuring special characters and formatting open properly in Microsoft Excel without corruption.
- **Smart Interactive Import Preview**:
  - Supports CSV files and JSON backups (including backups from the legacy `hr_calling_tracker.html` application).
  - Displays pre-import statistics: **Total Rows**, **Ready to Import**, **Duplicates (Skipped)**, and **Invalid Rows**.
  - Shows preview table of the first 20 records.
  - **Chunked Insertion**: Inserts records in safe batches of 200 with an animated progress bar to prevent timeout or payload limits.
  - Automatically maps old legacy contact IDs to new Supabase UUIDs so call histories remain linked to the right recruiter.
  - Button to download skipped duplicate/invalid rows as a CSV report.

---

### 9. Trash & Data Recovery

- Soft-deleted contacts and job applications are kept safely in the Trash.
- **Restore**: 1-click restore restores records back to the active directory.
- **Permanent Purge**: Permanently deletes records with confirmation dialog.

---

## 🛠️ Step-by-Step Installation & Setup Guide

### Prerequisites

- [Node.js 18+](https://nodejs.org/) installed on your machine.
- A free [Supabase](https://supabase.com/) account.
- A free [GitHub](https://github.com/) account.
- A free [Vercel](https://vercel.com/) account.

---

### Step 1: Clone Repository & Install Dependencies

Open your terminal and run:

```bash
# Clone the repository
git clone https://github.com/ChetanShelke04/job-tracker.git

# Navigate into project directory
cd job-tracker

# Install required dependencies
npm install
```

---

### Step 2: Create a Free Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Choose an Organization, enter a project name (e.g. `job-tracker`), and set a strong database password.
4. Select the region closest to you (e.g. _Central India (Mumbai)_).
5. Click **Create new project** and wait ~2 minutes for it to initialize.

---

### Step 3: Run Database Schema & Security Grants

1. In your Supabase project dashboard, click **SQL Editor** on the left menu (icon `>_`).
2. Click **New Query** (or the `+` icon).
3. Open `supabase/schema.sql` from this repository, copy its entire contents, paste them into the SQL Editor, and click the green **Run** button.
4. Verify you see: **"Success. No rows returned."**

> [!IMPORTANT]
> To ensure your authenticated web user has permission to read and insert records while Row Level Security (RLS) protects your data, run this SQL query in the **SQL Editor**:
>
> ```sql
> -- 1. Grant schema usage
> GRANT USAGE ON SCHEMA public TO anon, authenticated;
>
> -- 2. Grant table permissions (Only authenticated users; RLS isolates per-user records)
> GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
> GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
> GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;
>
> -- 3. Default privileges for future tables
> ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
> ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
> ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON ROUTINES TO authenticated;
> ```

---

### Step 4: Configure Supabase Authentication & Create Accounts

1. In Supabase, go to **Authentication** → **Providers** → **Email**.
2. Set **Allow new users to sign up** to **OFF** (prevents random strangers from signing up).
3. Set **Confirm email** to **OFF** (lets you and your friends log in immediately without waiting for confirmation emails).
4. Click **Save**.
5. In the Authentication sidebar, click **Users** → **Add user** → **Create new user**.
6. Create your user account:
   - Email: `chetan@jobtracker.app`
   - Password: `YourSecretPassword123!`
   - Toggle **Auto Confirm User?** to **ON**.
   - Click **Create user**.
7. _(Optional)_ Create accounts for your friends in the same way (e.g., `friend1@jobtracker.app`, `friend2@jobtracker.app`).

> [!TIP]
> When logging into the website, users only need to enter their username (e.g., `chetan`) and password!

---

### Step 5: Configure Environment Variables

1. In your Supabase Dashboard, go to **Project Settings** (gear icon) → **API**.
2. Copy your **Project URL** (e.g., `https://lofzkzwshfazvmwvrjpd.supabase.co`).
3. Copy your **anon / public key** (the string under _Project API keys_).
4. In your project root, create a file named `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

---

### Step 6: Run Locally

Start the Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Enter your username (`chetan`) and password to log in.

---

### Step 7: Deploy on Vercel ($0 / Free Forever)

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy Job Tracker"
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) using your GitHub account.
3. Click **Add New...** → **Project**.
4. Select `job-tracker` from your GitHub repository list and click **Import**.
5. In the setup screen, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (your Supabase Anon Key)
6. Click **Deploy**. Vercel will build and deploy your app in under 60 seconds!
7. **Final Configuration**:
   - Copy your live Vercel domain (e.g., `https://job-tracker-production.vercel.app`).
   - In Supabase, go to **Authentication** → **URL Configuration**.
   - Set **Site URL** to your Vercel URL.
   - Add your Vercel URL to **Redirect URLs**.

---

## 🔒 Database Schema & Security Deep Dive

### Database Tables

| Table Name         | Description                 | Key Columns                                                                                                                |
| :----------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `contacts`         | Directory of HR recruiters  | `id`, `user_id`, `name`, `company`, `phone`, `phone_key`, `email`, `status`, `followup_date`, `notes`, `deleted_at`        |
| `calls`            | Chronological log of calls  | `id`, `user_id`, `contact_id`, `outcome`, `notes`, `followup_date`, `called_at`                                            |
| `job_applications` | Job hunt pipeline           | `id`, `user_id`, `company_name`, `job_title`, `application_status`, `expected_ctc`, `offered_ctc`, `job_url`, `deleted_at` |
| `activities`       | Scheduled reminders & tasks | `id`, `user_id`, `contact_id`, `activity_type`, `scheduled_at`, `completed`                                                |

---

### Row Level Security (RLS)

Every table has Row Level Security enabled. The database evaluates:

```sql
auth.uid() = user_id
```

- When **User A** queries `contacts`, PostgreSQL internally filters rows to only return records where `user_id` matches User A's JWT token ID.
- Even if User B knows the UUID of User A's contact, any attempt to read, update, or delete it will return **0 rows affected** or **Permission Denied**.

---

### Atomic RPC Function: `log_call`

When a call outcome is saved, frontend calls:

```sql
SELECT public.log_call(
  p_contact_id := 'c4a9...',
  p_outcome := 'Connected',
  p_notes := 'Discussed React developer role, sending resume.',
  p_followup := '2026-11-28'
);
```

This PostgreSQL transaction guarantees that:

1. Contact ownership is verified (`user_id = auth.uid()`).
2. The call log record is inserted into `calls`.
3. The contact's `status`, `last_call_at`, and `followup_date` are updated together in a single transaction.

---

### Phone Normalization & Deduplication Logic

Phone numbers come in many formats:

- `+91 98765-43210`
- `09876543210`
- `98765 43210`

PostgreSQL computes a stored generated column:

```sql
phone_key text GENERATED ALWAYS AS (RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10)) STORED
```

The unique constraint `UNIQUE(user_id, phone_key)` ensures that a single user cannot accidentally save the same recruiter twice, while allowing two different users to independently track the same recruiter.

---

## 📋 Import & Export Format Specifications

### Contacts CSV Format

When importing or exporting contacts, use the following column headers:

```csv
name,company,phone,email,status,followup_date,interview_date,next_action,notes
Priya Sharma,Google,+919876543210,priya@google.com,Connected,2026-11-30,2026-12-05,Send updated CV,Discussed senior frontend opening
```

### Complete JSON Backup Format

```json
{
  "version": 1,
  "exportedAt": "2026-11-24T22:00:00.000Z",
  "contacts": [
    {
      "id": "uuid-here",
      "name": "Priya Sharma",
      "company": "Google",
      "phone": "+919876543210",
      "status": "Connected",
      "followup_date": "2026-11-30"
    }
  ],
  "calls": [],
  "applications": []
}
```

---

## ❓ Troubleshooting & FAQ

#### 1. Why do I see "Database table permissions missing. Please run the GRANT permissions SQL"?

This means PostgreSQL table permissions were not granted to the `authenticated` role.

- **Fix**: Open [Supabase SQL Editor](https://supabase.com/dashboard/project/lofzkzwshfazvmwvrjpd/sql/new), paste the grant script from [Step 3](#step-3-run-database-schema--security-grants), and click **Run**.

#### 2. Why do I see "Email confirmation is pending. Please verify your email or disable confirmation in Supabase"?
By default, Supabase requires users to click an email verification link before logging in. Since username accounts use internal addresses (e.g. `username@jobtracker.app`), no email is delivered.
- **Instant Fix for existing users (SQL)**: In your **Supabase SQL Editor**, run:
  ```sql
  UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
  ```
- **Permanent Fix for all future users**:
  1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Email**.
  2. Toggle **"Confirm email"** to **OFF** (Disabled).
  3. Click **Save**. All newly registered users can now log in immediately!

#### 2. If a friend forgets their password, can I view it in the Supabase database?

No. Passwords in Supabase are hashed using irreversible `bcrypt` algorithms. Even database administrators cannot see plain passwords.

- **Fix**: To change a user's password, go to **Supabase Dashboard** → **Authentication** → **Users** → click the `...` menu next to the user → click **Send password recovery** or manually set a new password.

#### 3. What if my Supabase project is paused?

Supabase free tier projects pause automatically after **1 week of complete inactivity**.

- **Fix**: Go to the Supabase Dashboard and click **Restore project**. It will wake up in ~1 minute with zero data loss. Logging in once a week keeps it permanently active.

#### 4. Can I import my CSV directly in the Supabase Table Editor?

No. Direct CSV import in the Supabase Table Editor does not assign your user's auth token or `user_id`. Always import using the web application's **Import / Export** page (`/import-export`) or the **Bulk Add** dialog.

---

## 📂 File Structure

```text
job-tracker/
├── index.html                           # HTML template with favicon & SEO meta
├── package.json                         # Dependencies & npm scripts
├── vite.config.js                       # Vite config with manual Rollup chunking
├── vercel.json                          # Vercel SPA route rewrite rules
├── .env.example                         # Template for environment variables
├── README.md                            # Complete documentation & user guide
├── supabase/
│   ├── schema.sql                       # Complete SQL migration with RLS & functions
│   └── migrations/
│       └── 20240101000000_init.sql      # Initial migration
└── src/
    ├── main.jsx                         # App bootstrap & React Router provider
    ├── App.jsx                          # Main route configuration & providers
    ├── styles.css                       # Modern Linear/Notion pure CSS design system
    ├── lib/
    │   ├── supabase.js                  # Supabase client & friendly error handler
    │   ├── constants.js                 # Status constants, outcomes & color styles
    │   ├── dates.js                     # Date parsing, overdue badges & timezone tools
    │   ├── csv.js                       # UTF-8 BOM CSV generator & parser
    │   └── importer.js                  # CSV/JSON normalizer, validator & 200-chunker
    ├── context/
    │   ├── AuthContext.jsx              # Supabase session, username mapper & auth state
    │   └── ContactsContext.jsx          # Live data state, optimistic updates & RPC calls
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.jsx            # Shell with responsive sidebar, topbar & bottom nav
    │   │   └── Sidebar.jsx              # Collapsible sidebar, cloud sync status & profile
    │   ├── common/
    │   │   ├── ProtectedRoute.jsx       # Route guard redirecting unauthenticated users
    │   │   ├── StatusBadge.jsx          # Color-coded badge pills
    │   │   └── Toast.jsx                # Toast alerts with Undo support
    │   ├── contacts/
    │   │   ├── ContactModal.jsx         # Add/Edit contact dialog with duplicate checker
    │   │   └── BulkModal.jsx            # Spreadsheet paste & batch add modal
    │   ├── calls/
    │   │   ├── CallModal.jsx            # Atomic call logger with outcome & followup
    │   │   └── HistoryModal.jsx         # Chronological conversation timeline
    │   ├── applications/
    │   │   └── ApplicationModal.jsx     # Job application details dialog
    │   └── import/
    │       └── ImportPreview.jsx        # Pre-import data validator & batch progress
    └── pages/
        ├── Login.jsx                    # Clean login & password recovery form
        ├── Dashboard.jsx                # High-impact metric cards & urgent callbacks
        ├── Contacts.jsx                 # Recruiter directory with live search & filters
        ├── FollowUps.jsx                # Overdue alerts & quick reschedule buttons
        ├── Applications.jsx             # Job hunt pipeline with Table & Kanban view
        ├── ImportExport.jsx             # JSON backup & CSV import/export center
        └── Trash.jsx                    # Soft-deleted records restoration
```

---

## 📄 License

This project is open-source and free to use under the [MIT License](LICENSE). Built for job seekers everywhere. Good luck with your job hunt! 🚀
