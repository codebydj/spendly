# Spendly — Premium Personal Finance Application (V3)

**Spendly** is a high-performance, mobile-first personal finance application built with **React**, **TypeScript**, **Vite**, **Lucide Icons**, **Web Audio API**, **Capacitor**, and **Supabase Backend**. Designed for financial accuracy, multi-account management, cloud sync, offline operation (IndexedDB/PWA), budgeting, analytics, and privacy.

---

## 🎨 Design System & Visual Architecture (V3)

- **Midnight Indigo Palette**: `#080A18` deep background, `#0D1024` surface base, `#11152E` card elevation, and `#1A1F3D` high-level cards with subtle border glows.
- **Electric Violet & Cyan Accents**: `#8B5CF6` (Electric Violet), `#22D3EE` (Cyan Glow), `#10B981` (Emerald Income), and `#F43F5E` (Rose Expense).
- **4-Level Glassmorphism Hierarchy**:
  - `card-level-1`: Background panels & subtle containers (`rgba(13, 16, 36, 0.75)`).
  - `card-level-2`: Interactive cards, transaction rows, and inputs (`rgba(17, 21, 46, 0.85)`).
  - `card-level-3`: Prominent metrics cards & modal overlays (`rgba(22, 27, 56, 0.9)`).
  - `card-level-4`: Hero Net Worth card & primary focus elements with ambient glows.
- **Soft Neumorphism & Claymorphism**: Tactile pressed states for navigation controls and pill-shaped status badges.
- **Web Audio API Transaction Chime**: Zero external assets. Synthesizes a pleasant dual-frequency harmonic chime (880 Hz / 1320 Hz) upon saving transactions.
- **Tabular Numbers**: `Inter` and `Manrope` font stack with `font-variant-numeric: tabular-nums` for crisp financial value alignment.

---

## 🚀 Core Features

1. **Supabase Cloud Sync & Authentication**:
   - Secure email/password **Login** and **Signup** with Row-Level Security (RLS).
   - Automatic two-way cloud sync with IndexedDB offline-first local caching.
   - Interactive **`Sync now`** badge in Header & Settings for immediate cloud synchronization.

2. **Web Audio Sound Effects**:
   - Web Audio API synthesized transaction chime and sync sounds.
   - Toggleable Sound Effects setting in Settings View.

3. **Multi-Account Dashboard**:
   - Track **Bank Accounts**, **Cash**, **Wallets**, and **Credit Cards**.
   - Aggregate **Total Net Worth** with privacy hide-balances toggle (`₹•••••`).
   - Account drawer with account-specific month metrics and transaction activity.

4. **Fast Transaction Entry & Smart Category Suggestions**:
   - Quick entry modal supporting **Expense**, **Income**, and **Transfer**.
   - Auto-categorization based on note keywords (e.g. `Swiggy` → Food, `Amazon` → Shopping, `Uber` → Transport, `Salary` → Salary).

5. **Internal Account Transfers**:
   - Deducts from source account and credits destination account without altering net worth or polluting spending analytics.

6. **Monthly Budgets & Category Limits**:
   - Interactive category limits with progress bars and alerts when approaching or exceeding limits.

7. **Analytics & Financial Visualizations**:
   - SVG Donut Charts (Category distribution) and Bar Charts (Income vs Expenses trend) with account and timeframe filters.

8. **Recurring Payments & Financial Calendar**:
   - Subscription and bill tracker with next due dates and pause/resume controls.
   - Monthly calendar grid displaying daily transaction totals.

9. **Mobile-First Experience & Android App**:
   - Safe-area bottom navigation bar for mobile devices.
   - Native haptic feedback and Capacitor Android integration.
   - Offline PWA support with service worker (`sw.js`).

---

## 🛠️ Project Structure

- **`src/services/soundService.ts`**: Web Audio API audio chime generator.
- **`src/services/syncService.ts`**: Supabase & IndexedDB two-way cloud sync service.
- **`src/context/AppContext.tsx`**: Central application state, authentication, cloud sync triggers, and transaction logic.
- **`src/index.css`**: Complete V3 Midnight Indigo & Electric Violet design system, glassmorphic hierarchy, neumorphic controls, and animations.
- **`src/components/layout/`**: Header, DesktopSidebar, and MobileNav components.
- **`src/components/forms/`**: AddTransactionModal, AddAccountModal, AddBudgetModal, AddRecurringModal, and PinLockModal.
- **`src/views/`**: DashboardView, AccountsView, TransactionsView, BudgetsView, AnalyticsView, CalendarView, RecurringView, NotificationsView, SettingsView, LoginView, and SignupView.

---

## ⚡ Development & Deployment

### 1. Local Development
```bash
npm install
npm run dev
```

### 2. Type Check & Build
```bash
npx tsc --noEmit
npm run build
```

### 3. Vercel SPA Deployment
The repository includes `vercel.json` configured for SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Set Vercel environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4. Capacitor Android Release
To sync and build the Android APK:
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```
The signed APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

