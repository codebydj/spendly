export interface VersionHistoryItem {
  version: string;
  isCurrent?: boolean;
  date: string;
  title: string;
  features?: string[];
  fixes?: string[];
  highlights?: string[];
}

export const VERSION_HISTORY: VersionHistoryItem[] = [
  {
    version: 'V3.3.1',
    isCurrent: true,
    date: '30 September 2026',
    title: 'Mobile Experience, Notifications & Release UX',
    features: [
      'Added one-time What\'s New experience after application updates.',
      'Redesigned Version History with separate Features and Bugs Fixed sections.',
      'Improved mobile notification center and notification actions.',
      'Added richer deterministic financial insight notifications.',
      'Improved mobile responsiveness across key Spendly screens.',
      'Added additional polished transitions and loading feedback.',
    ],
    fixes: [
      'Fixed Add Transaction Expense/Income/Transfer selector shaking.',
      'Fixed layout shifts when switching transaction types.',
      'Improved mobile bottom-sheet and responsive behavior.',
      'Fixed additional mobile spacing and interaction inconsistencies.',
    ],
  },
  {
    version: 'V3.3.0',
    isCurrent: false,
    date: '30 September 2026',
    title: 'Account Management, Reconciliation & Reliability',
    features: [
      'Complete bank/account details editing',
      'Balance adjustment workflow',
      'Account statement reconciliation',
      'Bank statement CSV import',
      'Account activity history',
      'Account archiving/restoration',
      'Budget threshold improvements',
      'Reminder Snooze and Skip Cycle',
    ],
    fixes: [
      'Fixed recurring-payment Supabase sync errors',
      'Improved RLS error handling',
      'Fixed modal state during navigation',
      'Improved transaction validation',
      'Fixed small touch targets',
    ],
  },
  {
    version: 'V3.2.4',
    date: '27 September 2026',
    title: 'Mobile UX, Transactions & Notifications',
    features: [
      'Redesigned compact mobile transaction filters & bottom sheet',
      'Added mobile synchronization status indicator and bottom sheet access',
      'Improved Settings organization, subpage navigation, and deep search',
      'Redesigned Version History for compact release browsing with accordion collapse',
      'Improved notification preferences, deep linking, and reminder experiences',
      'Configured client push notification handling architecture and deep-linking',
    ],
    fixes: [
      'Fixed blank and malformed Transaction detail layouts',
      'Improved mobile Dashboard responsiveness and charts',
      'Improved Add/Edit Transaction responsiveness & mobile Date/Time field ordering',
      'Fixed current-location coordinate and suggestion behavior',
      'Fixed blank Map filter and bottom-sheet states with React Portal',
      'Improved route persistence on browser reload',
      'Improved page scroll behavior during primary navigation',
    ],
  },
  {
    version: 'V3.2.3',
    date: '27 September 2026',
    title: 'Spendly V3.2.3 Mobile Maps & Stability Update',
    features: [
      'Improved pinch-to-zoom, touch gestures, and WebView map lifecycle handling',
      'Enhanced mobile Maps responsive layout, compact summary metrics, and touch targets',
      'Improved mobile bottom sheet interaction without blocking Leaflet touch gestures',
    ],
    fixes: [
      'Fixed Maps zoom resetting in the Android Capacitor application',
      'Improved mobile marker clustering and narrow-viewport collision handling',
      'Preserved map camera position during navigation, view switches, and resize events',
      'App state resume and orientation change map invalidation without camera resets',
    ],
  },
  {
    version: 'V3.2.2',
    date: '27 September 2026',
    title: 'Spendly V3.2.2 UI & Feature Upgrade',
    features: [
      'Redesigned transaction list rows with category-first vector icons and clean typography',
      'Enhanced transaction type indicators (+Income green, -Expense red, ⇄ Transfer neutral blue)',
      'Completely redesigned Locations tab with classic teardrop map pins and category icons',
      'Enhanced bank branding component and distinct account type recognition icons',
      'Redesigned Financial Calendar with daily totals, date transaction panel, and bill reminders',
    ],
    fixes: [
      'Resolved map camera reset issues with persistent Leaflet map container and single-execution fitBounds',
      'Streamlined navigation with Savings Goal hidden from UI while preserving data compatibility',
    ],
  },
  {
    version: 'V3.2.1',
    date: '27 September 2026',
    title: 'Spendly V3.2.1 Design & Feature Release',
    features: [
      'Restored consistent dark navy, blue, cyan & violet theme across all screens',
      'Compact 10-section accessible settings accordion with live search',
      'Saved transaction filter preferences per user with reset action',
      'Duplicate transaction action pre-filling new record modal with current timestamp',
      'Unsaved-change form protection and double-submit prevention',
      'Dashboard refinement with concise insight titles and balanced cards',
    ],
    fixes: [],
  },
  {
    version: 'V3.1.6',
    date: '16 September 2026',
    title: 'Spendly V3.1.6 Stabilization & Parity Release',
    features: [
      'Same-version update comparison reporting up to date without modal prompts',
      'Native Android CSV & JSON backup export with file saving and share sheet',
      'Interactive Spendly SVG map markers with Unknown Location details panel',
      'Cleaned and deduplicated chronological version history',
      'Redesigned App Lock settings UI with secure 4-digit PIN setup, removal, and recovery',
      'Consolidated single-badge top header network and cloud sync indicator',
    ],
    fixes: [],
  },
  {
    version: 'V3.1.5',
    date: '15 September 2026',
    title: 'Update Manifest & Notification Parity',
    features: [
      'HTTPS production manifest fetching for native Android update checks',
      'Native Android installed version detection via Capacitor App.getInfo()',
      'Interactive system and version diagnostic modal in Settings',
      'Version-keyed update dismissal preventing stale notification suppression',
    ],
    fixes: [],
  },
  {
    version: 'V3.1.4',
    date: '15 September 2026',
    title: 'Update Engine Diagnostics & Release Links',
    features: [
      'Future release update engine finalization',
      'Runtime diagnostic engine for update discovery',
      'Updated Google Drive APK download link',
    ],
    fixes: [],
  },
  {
    version: 'V3.1.3',
    date: '15 September 2026',
    title: 'Web & Android Release Parity',
    features: [
      'Full Web and Android release parity with monochrome notification icons',
      'Interactive place search and location confirmation in Maps tab',
      'Automated release verification scripts',
    ],
    fixes: [],
  },
  {
    version: 'V3.1.2',
    date: '15 September 2026',
    title: 'Automatic Sync & Update Experience',
    features: [
      'Automatic bidirectional Supabase synchronization',
      'Realtime cloud updates across Web and Android',
    ],
    fixes: [
      'Improved offline-to-online sync queue handling',
    ],
  },
  {
    version: 'V3.1.1',
    date: '15 September 2026',
    title: 'Sync and Stability Update',
    features: [
      'Supabase synchronization performance improvements',
      'Android and Web device stability enhancements',
    ],
    fixes: [
      'Cloud persistence fixes and parallel IndexedDB hydration',
    ],
  },
  {
    version: 'V3.1.0',
    date: '15 September 2026',
    title: 'Data and Reliability Update',
    features: [
      'Offline persistence improvements and IndexedDB storage',
      'Pending sync queue and cloud reconciliation',
      'App update notification system',
    ],
    fixes: [],
  },
  {
    version: 'V3.0.8',
    date: '15 September 2026',
    title: 'Maps & Usability Finalization',
    features: [
      'Added proper Pick on Map option when editing transaction locations',
      'Improved map location search, pin selection, and place editing',
      'Improved Calendar, Categories, Reminders, and Settings usability',
    ],
    fixes: [],
  },
  {
    version: 'V3.0.0',
    date: '14 September 2026',
    title: 'Spendly V3 Major Release',
    features: [
      'New indigo, violet, blue, and cyan visual identity',
      'Glassmorphic UI, Analytics breakdown, Calendar, and Maps',
      'Place search, map pickers, and bill payment reminders',
    ],
    fixes: [],
  },
  {
    version: 'V2.0.0',
    date: '14 September 2026',
    title: 'Major Architecture & UI Update',
    features: [
      'Redesigned glassmorphic personal finance interface',
      'Offline-first architecture with Supabase cloud persistence',
      'Capacitor Android integration',
    ],
    fixes: [],
  },
  {
    version: 'V1.0.0',
    date: '12 September 2026',
    title: 'Initial Release',
    features: [
      'Core personal finance tracking, accounts, income, and expenses',
      'Category monthly budgets and secure authentication',
    ],
    fixes: [],
  },
];
