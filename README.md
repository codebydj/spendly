# Spendly

### A modern personal finance tracker for Web and Android.

Spendly is a modern, mobile-first personal finance application designed to help users manage their money, multi-account balances, transactions, budgets, bill reminders, financial calendar, and location-mapped spending insights in one place.

It combines a sleek glassmorphic interface with offline-first local persistence, Supabase cloud synchronization, intelligent online place search, Leaflet interactive map pickers, and native Android support.

---

## 1. Overview

Spendly empowers individuals to track their financial life securely across devices. Whether managing daily expenses, tracking bank and credit card accounts, scheduling bill reminders, or visualizing transactions on an interactive map, Spendly delivers a fast, privacy-focused experience both online and offline.

---

## 2. Web Application

The Spendly web application runs directly in any modern browser without requiring installations or plugins.

- **URL**: Available via Vercel deployment.
- **Offline Support**: Full functionality offline powered by local IndexedDB caching.
- **Instant Cloud Sync**: Syncs automatically with Supabase when internet connectivity is detected.

---

## 3. Android Application

Spendly is available as a native Android application powered by Capacitor.

- **Package ID**: `com.spendly.finance`
- **Current Version**: `V3.0.8`
- **Build Date**: `14 September 2026`
- **Distribution**: Direct APK download (No Google Play Store required).

Features native mobile integration including local notification scheduling for bill reminders, haptic feedback, safe-area navigation, and native GPS permission handling.

---

## 4. Features

- 🔐 **Authentication**: Sign in, sign up, profile management, and email password reset.
- 💰 **Multi-Account Tracking**: Bank accounts, cash, credit cards, wallets, and custom accounts.
- 💳 **Transactions**: Income, expense, and internal account transfer entries.
- 🗺️ **Transaction Locations**: Online place search, interactive map picker, current GPS, and manual entry.
- ⏰ **Reminders & Bills**: Scheduled recurring payments with native Android notifications.
- 📅 **Financial Calendar**: Daily breakdown, Today quick-jump, and controlled-height scrollable activity panel.
- 📊 **Analytics & Budgets**: Category budgets with 75%, 90%, 100% alerts and visual charts.
- 🏷️ **Category Management**: Custom creation, color coding, up/down reordering handles, and transaction reassignment protection before category deletion.
- 📴 **Offline-First Storage**: Local IndexedDB caching with automatic Supabase cloud synchronization.
- 🔒 **Privacy & App Lock**: Hide balance privacy mode (`₹•••••`) and optional 4-digit PIN lock.

---

## 5. Accounts

Manage all your money in one place.

Supported Account Types:
- 🏦 **Bank Account** (Savings & Checking)
- 💳 **Credit Card** (With credit limits & balance tracking)
- 👛 **Wallet** (Digital wallets & UPI balances)
- 💵 **Cash** (Physical cash on hand)
- 💼 **Other** (Investments & custom assets)

Automatically calculates total net worth across all accounts with privacy mask toggle.

---

## 6. Transactions

Record financial entries with detail:
- **Types**: Expense, Income, Transfer.
- **Fields**: Amount, Date, Time, Account, Category, Payment Method (UPI, Net Banking, Debit Card, Credit Card, Cash), Notes, and Location details.
- **Transfer Handling**: Single-click transfer between accounts with balance updating.

---

## 7. Budgets

Set monthly spending limits for individual categories.
- Automatic calculation of spent percentage vs monthly limit.
- Visual alerts at 75% (warning), 90% (critical), and 100% (exceeded).

---

## 8. Analytics

Gain insights into spending habits:
- Category spending distribution pie charts.
- Monthly income vs expense trend comparison.
- Daily average spending calculation.
- Top spending categories and locations breakdown.

---

## 9. Calendar

Visual financial calendar view:
- Month navigation controls (`<` and `>`).
- **Today** button to immediately jump to the current date.
- Controlled-height calendar grid with daily income and expense indicator dots.
- Independently scrollable side panel showing selected date transaction rows and day summary totals.

---

## 10. Transaction Locations and Maps

Attach location data to transactions:
- **Online Place Search**: Real-time autocomplete using Photon and Nominatim APIs for schools, colleges, ATMs, restaurants, hospitals, malls, stations, and landmarks.
- **Interactive Map Picker**: Drag-and-drop Leaflet marker with reverse geocoding.
- **Current Location**: On-demand GPS position retrieval.
- **Manual Location**: Custom place naming with optional coordinates.
- **Unknown Locations**: If coordinates cannot be reverse-geocoded, saved as `"Unknown Location"` while retaining raw latitude and longitude.

> **Location Privacy Statement**: Spendly does NOT continuously track the user's location in the background. Location access is invoked strictly when the user explicitly triggers a location action.

---

## 11. Reminders and Notifications

Manage recurring bill commitments:
- Frequencies: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- Custom notification lead time (e.g. 1 day before due date at specified due time).
- Direct **Mark as Paid** action with duplicate transaction protection per due cycle.
- Local notification scheduling on Android devices using deterministic notification hash IDs.

---

## 12. Category Management

Full category customization in Settings:
- Compact collapsed view showing `Category Management (10)` count.
- Expanded editor with `GripVertical` drag handles and Move Up / Move Down buttons.
- Safe deletion protection: if a category has assigned transactions, Spendly prompts the user to reassign those transactions to another category before deleting.

---

## 13. Offline Support

- Financial entries are saved locally to IndexedDB immediately.
- The app operates seamlessly without an active internet connection.
- Pending offline changes are queued and synced automatically upon reconnecting.

---

## 14. Supabase Cloud Sync

- **Cloud Storage**: PostgreSQL database powered by Supabase.
- **Row-Level Security (RLS)**: Enforces strict data isolation so each user can only access their own records.
- **Manual Sync**: One-touch "Sync Now" button in the header and Settings.

---

## 15. Authentication and Security

- Email and password sign-in and sign-up.
- **Forgot Password**: Password reset request via Supabase Auth email link.
- **App Lock**: Optional 4-digit PIN lock required upon opening the app.
- **Privacy Mode**: Mask monetary values with `₹•••••`.

---

## 16. Settings

Centralized configuration organized into clear sections:
1. **Profile**: Account details and name editing.
2. **Appearance & Audio**: Balance masking, sound effects toggle, currency setting.
3. **Notifications**: Daily reminder time, test notification trigger.
4. **Data & Sync**: Supabase sync status, JSON export/import, local reset, full data reset.
5. **Security**: 4-digit PIN lock setup.
6. **Categories**: Compact category management editor.
7. **Download Application**: Android APK direct download link.
8. **Application Information**: Version `V3.0.8`, Build Date `14 September 2026`, Package ID `com.spendly.finance`.
9. **Version History**: Collapsible release history timeline.
10. **Developer**: Dhanunjaya (`@codebydj`) attribution and GitHub link.

---

## 17. Android APK Download

Spendly Android APK is available via direct download without requiring the Google Play Store.

- **Version**: `V3.0.8`
- **Build Date**: `14 September 2026`
- **Package ID**: `com.spendly.finance`
- Configurable via `ANDROID_APK_DOWNLOAD_URL` constant in `SettingsView.tsx`.

---

## 18. Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS, Design System Tokens, Glassmorphism
- **Icons**: Lucide React Icons
- **Database & Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Mobile Runtime**: Capacitor (`@capacitor/geolocation`, `@capacitor/local-notifications`, `@capacitor/haptics`, `@capacitor/app`)
- **Maps & Geocoding**: Leaflet, Photon API, Nominatim OpenStreetMap API

---

## 19. Project Structure

```text
Spendly/
├── android/                  # Capacitor Android native project
├── public/                   # App icons, favicons, static assets
├── scripts/                  # Asset build and icon scripts
├── src/
│   ├── components/           # UI components, modals, and forms
│   │   ├── forms/            # Add/Edit transaction & reminder modals
│   │   ├── layout/           # Header, DesktopSidebar, MobileNav
│   │   ├── modals/           # SelectLocationMapModal
│   │   └── ui/               # GlassCard, SpendlyLogo, Modal
│   ├── context/              # AppContext global state manager
│   ├── db/                   # StorageEngine, schema.sql, migrations
│   ├── services/             # Supabase client, LocationService, NativeNotifications
│   ├── types/                # TypeScript interfaces (finance, user)
│   ├── views/                # Main application views (Dashboard, Maps, Calendar, Settings)
│   ├── App.tsx               # Main routing & application layout
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global CSS design system tokens
├── capacitor.config.json     # Capacitor configuration
├── package.json              # Project dependencies and build scripts
├── README.md                 # Project documentation
└── vite.config.ts            # Vite bundler configuration
```

---

## 20. Local Development

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Setup Instructions
1. Clone repository:
   ```bash
   git clone https://github.com/codebydj/spendly.git
   cd spendly
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build production bundle:
   ```bash
   npm run build
   ```

---

## 21. Deployment

### Web Deployment
Deploy the `dist/` directory produced by `npm run build` to Vercel, Netlify, or any static web host.

### Android Build
Sync web build to Android project:
```bash
npx cap sync android
```
Open in Android Studio to build APK:
```bash
npx cap open android
```

---

## 22. Version History

### V3.0.8 (14 September 2026) — CURRENT
- Added a proper Pick on Map option when editing transaction locations
- Improved map location search, pin selection and location editing
- Improved the Maps tab and removed unnecessary place counters
- Improved version history and application information
- Improved Calendar, Categories, Reminders and Settings usability
- Added final responsive, stability and synchronization improvements

### V3.0.7
- Improved mobile responsiveness across small devices
- Fixed interface alignment and icon rendering issues
- Improved synchronization reliability
- Prepared the application for the V3.0.8 release

### V3.0.6
- Improved Calendar layout and navigation controls
- Added independent scrolling for transaction side lists
- Expanded financial analytics breakdown and charts

### V3.0.5
- Improved category management interface
- Added category drag reordering and safe transaction reassignment
- Improved Settings layout and controls

### V3.0.4
- Improved payment and bill reminders tracking
- Added native Android local notification scheduling
- Improved reminder controls and notification behavior

### V3.0.3
- Improved online place searching with Photon and Nominatim
- Improved location suggestions and place details
- Improved handling of unknown location coordinates

### V3.0.2
- Added transaction location support
- Added interactive Leaflet map functionality
- Improved location search and details panel

### V3.0.1
- Improved mobile and desktop layouts
- Fixed interface alignment and spacing issues
- Improved application stability

### V3.0.0
- Introduced the new indigo, violet, blue and cyan visual identity
- Improved the glass-style interface and responsive layouts
- Improved accounts, transactions, budgets and dashboard experience
- Added stronger cloud synchronization and offline support

### V2.0.1
- Enhanced offline synchronization reliability
- Fixed minor UI alignment and animation issues

### V2.0.0
- Introduced the modern Spendly interface and glass-style design
- Added offline support so the app can continue working without internet
- Added Supabase cloud storage and account-based data synchronization
- Added Android app support
- Improved analytics and notification foundations

### V1.0.3
- Improved budget calculations and transaction form validation

### V1.0.2
- Added support for credit cards, bank accounts, and wallet tracking

### V1.0.1
- Fixed minor account balance display and security issues

### V1.0.0
- Track income and expenses
- Manage multiple accounts and balances
- Create monthly budgets
- Sign in securely
- View financial information from one dashboard

---

## 23. Developer

Developed by **Dhanunjaya** (`@codebydj`)

- **GitHub**: [https://github.com/codebydj](https://github.com/codebydj)

© 2026 Dhanunjaya. All rights reserved.

---

## 24. License

This project is maintained by Dhanunjaya. All rights reserved.