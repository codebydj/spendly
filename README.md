# Spendly — Production Personal Finance Tracker

**Spendly** is a serious, dark-first personal finance tracking web application built with **React**, **TypeScript**, **Vite**, **Lucide Icons**, and **Supabase Authentication**. Designed for clarity, financial accuracy, multi-account management, offline operation (IndexedDB/PWA), budgeting, analytics, and privacy.

---

## Key Product Philosophy & Design System

- **Dark-First Palette**: `#080B12` base background, `#0D1117` main surface, `#121722` card containers, `#171D29` elevated surfaces, and `#252D3A` subtle borders.
- **Restrained Emerald Accent**: `#10B981` (primary), `#059669` (hover), `#F59E0B` (warnings), and `#EF4444` (danger/expenses). Zero purple, zero neon, zero excessive glassmorphism.
- **Rectangular Controls**: Conventional rectangular buttons with modest corner radii (`border-radius: 6px`). Zero pill buttons, zero fake reviews/metrics/testimonials.
- **100% Fit Sticky Sidebar**: Desktop navigation is pinned to `100vh` sticky height with quiet scrolling, ensuring bottom Settings, profile, and connection status links are always immediately visible without page scrolling.
- **Tabular Numbers**: `Inter` and `Manrope` fonts configured with `font-variant-numeric: tabular-nums` for precise alignment of financial values.

---

## Core Features

1. **Supabase Authentication**:
   - Individual **Login** and **Signup** views integrated with `@supabase/supabase-js` / `@supabase/ssr`.
   - Start page defaults to Login if unauthenticated; auto-routes to Dashboard upon sign in.
   - User profile session tracking and sign out capabilities.

2. **Multi-Account Dashboard**:
   - Supports **Bank Accounts** (SBI Savings, HDFC Savings), **Cash**, **Wallets** (UPI Wallet), and **Credit Cards**.
   - Aggregate **Total Net Balance** (`₹40,050`).
   - Account detail drawer showing account-specific balances, month income/expenses, net change, and transaction history.

3. **Fast Transaction Entry & Smart Category Suggestion**:
   - Quick entry modal supporting **Expense**, **Income**, and **Transfer** types.
   - Typing merchant names automatically suggests categories (`Swiggy` → Food, `Amazon` → Shopping, `Uber` → Transport, `Electricity` → Bills) with a 1-click **Apply** button.

4. **Internal Account Transfers**:
   - Deducts from source account and credits target account.
   - **Does NOT alter total net worth or pollute spending analytics or category budgets**.

5. **Monthly Budgets & Category Progress**:
   - Monthly category limits with clear progress bars and explicit text badges (`ON TRACK`, `80% REACHED`, `OVER BUDGET`).

6. **Analytics & SVG Charts**:
   - Donut Chart ("Where your money went") and Bar Chart (Income vs Expenses comparison) with account filtering (`All Accounts` or specific accounts) and period selection (`Week`, `Month`, `Year`).

7. **Financial Calendar & Recurring Bills**:
   - Monthly calendar grid showing dates with transaction markers and date detail drawer.
   - Recurring bill manager for house rent, digital subscriptions, and insurance with pause/resume controls.

8. **Privacy Controls & Security PIN**:
   - **Hide Balances Toggle**: Replaces financial amounts with `₹•••••`.
   - **PIN Lock**: 4-digit PIN security lock screen.

9. **Offline-First Storage & Data Export**:
   - Local DB engine (`StorageEngine`) saving data to IndexedDB / LocalStorage.
   - Service worker (`sw.js`) and PWA manifest (`manifest.json`) for mobile installation.
   - Full backup export/import (JSON) and CSV transaction export.

---

## Detailed File-by-File Explanation

### 📁 Root & Configuration Files
- **`package.json`**: Defines project dependencies (`react`, `react-dom`, `lucide-react`, `@supabase/supabase-js`, `@supabase/ssr`, `vite`, `typescript`).
- **`vite.config.ts`**: Vite configuration file setting up the React plugin and dev server.
- **`tsconfig.json` & `tsconfig.app.json`**: TypeScript compiler options supporting Vite React bundler mode and `@/*` path aliases.
- **`index.html`**: HTML application shell, importing Google Fonts (Inter & Manrope), meta tags, favicon, and PWA manifest.
- **`.env.local`**: Environment variables storing Supabase project URL (`NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL`) and publishable key.
- **`README.md`**: Complete application documentation and file index.

### 📁 Public PWA Assets (`/public`)
- **`public/manifest.json`**: Web App Manifest enabling PWA installation on mobile and desktop.
- **`public/sw.js`**: Service Worker script caching static assets and enabling offline application usage.
- **`public/favicon.svg`**: Minimalist emerald app icon (`₹`).

### 📁 Supabase Utilities (`/src/utils/supabase` & `/utils/supabase`)
- **`src/utils/supabase/client.ts` / `utils/supabase/client.ts`**: Browser Supabase client helper initialized via `@supabase/supabase-js` for authentication and database queries.
- **`src/utils/supabase/server.ts` / `utils/supabase/server.ts`**: Safe server component helper fallback.
- **`src/utils/supabase/middleware.ts` / `utils/supabase/middleware.ts`**: Safe middleware session refresher helper.
- **`page.tsx` / `src/page.tsx`**: Sample async server component demonstrating Supabase table querying.
- **`login/page.tsx`**: Dedicated Next.js App Router login page component (`/login`).
- **`signup/page.tsx`**: Dedicated Next.js App Router signup page component (`/signup`).

### 📁 Types & Local Persistence (`/src/types` & `/src/db`)
- **`src/types/finance.ts`**: TypeScript interfaces for `Account`, `Transaction`, `Category`, `Budget`, `RecurringPayment`, `NotificationItem`, `AppSettings`, and `BackupData`.
- **`src/db/initialData.ts`**: Realistic initial seed financial dataset in INR (`₹40,050` balance, SBI Savings, HDFC Savings, Cash, UPI Wallet, sample transactions, budgets, and recurring bills).
- **`src/db/storage.ts`**: Local persistence storage engine (`StorageEngine`) managing browser local DB read/write, JSON export, and JSON restore.

### 📁 Application State & Context (`/src/context`)
- **`src/context/AppContext.tsx`**: Central application state provider managing view routing, active accounts, transactions, account transfers, budget limits, notifications, privacy lock, toast notifications, and Supabase auth state (`user`, `logout`).

### 📁 Layout Components (`/src/components/layout`)
- **`src/components/layout/DesktopSidebar.tsx`**: Pinned `100vh` sticky desktop sidebar with Spendly branding, navigation links, quick transaction button, connection status, and settings links.
- **`src/components/layout/MobileNav.tsx`**: Dedicated bottom navigation bar for mobile viewports with quick action button and popup drawer.
- **`src/components/layout/Header.tsx`**: Top contextual bar displaying section title, global search bar, hide balances privacy toggle, and network status badge.

### 📁 UI Components & Overlays (`/src/components/ui`)
- **`src/components/ui/Toast.tsx`**: Fixed container for subdued toast confirmation messages.
- **`src/components/ui/Modal.tsx`**: Accessible center overlay modal container.
- **`src/components/ui/BottomSheet.tsx`**: Mobile slide-up bottom sheet container.
- **`src/components/ui/Charts.tsx`**: SVG Donut Chart ("Where your money went") and Bar Chart (Income vs Expense trend).

### 📁 Modals & Forms (`/src/components/forms`)
- **`src/components/forms/AddTransactionModal.tsx`**: Fast transaction entry modal for Expenses, Income, and Internal Account Transfers with smart category suggestion.
- **`src/components/forms/AddAccountModal.tsx`**: Modal form for creating bank, cash, wallet, or credit card accounts.
- **`src/components/forms/AddBudgetModal.tsx`**: Modal for defining category monthly spending limits.
- **`src/components/forms/AddRecurringModal.tsx`**: Modal for adding recurring bills and subscriptions.
- **`src/components/forms/PinLockModal.tsx`**: 4-digit PIN security lock overlay.

### 📁 Main Application Views (`/src/views`)
- **`src/views/DashboardView.tsx`**: Primary financial overview showing total net balance, income/expense metrics, accounts grid, donut spending chart, and recent activity.
- **`src/views/AccountsView.tsx`**: Full accounts dashboard grouped by type, account detail metrics, and account-specific history filtering.
- **`src/views/TransactionsView.tsx`**: Searchable, filterable transaction table grouped by date with CSV export.
- **`src/views/BudgetsView.tsx`**: Spending progress bars with category budget limit warnings.
- **`src/views/AnalyticsView.tsx`**: Financial analytics dashboard with period selector, account filter, and SVG charts.
- **`src/views/RecurringView.tsx`**: Recurring bill and subscription tracker with pause/resume actions.
- **`src/views/CalendarView.tsx`**: Interactive monthly financial calendar with daily transaction breakdown.
- **`src/views/NotificationsView.tsx`**: Notifications feed with read/unread status and clear actions.
- **`src/views/SettingsView.tsx`**: Privacy controls, PIN setup, JSON backup export, JSON restore, and PWA status.
- **`src/views/LoginView.tsx`**: Standalone dark-first Supabase Login view.
- **`src/views/SignupView.tsx`**: Standalone dark-first Supabase Signup view.

---

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
