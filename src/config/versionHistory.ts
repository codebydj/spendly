export interface VersionHistoryItem {
  version: string;
  isCurrent?: boolean;
  date: string;
  title: string;
  highlights: string[];
}

export const VERSION_HISTORY: VersionHistoryItem[] = [
  {
    version: 'V3.2.2',
    isCurrent: true,
    date: '27 September 2026',
    title: 'Spendly V3.2.2 UI & Feature Upgrade',
    highlights: [
      'Redesigned transaction list rows with category-first vector icons and clean typography',
      'Enhanced transaction type indicators (+Income green, -Expense red, ⇄ Transfer neutral blue)',
      'Completely redesigned Locations tab with classic teardrop map pins and perfectly upright category icons',
      'Resolved map camera reset issues with persistent Leaflet map container and single-execution fitBounds',
      'Enhanced bank branding component and distinct account type recognition icons',
      'Redesigned Financial Calendar with daily totals, date transaction panel, and bill reminders',
      'Streamlined navigation with Savings Goal hidden from UI while preserving data compatibility',
    ],
  },
  {
    version: 'V3.2.1',
    date: '27 September 2026',
    title: 'Spendly V3.2.1 Design & Feature Release',
    highlights: [
      'Restored consistent dark navy, blue, cyan & violet theme across all screens',
      'Compact 10-section accessible settings accordion with live search',
      'Saved transaction filter preferences per user with reset action',
      'Duplicate transaction action pre-filling new record modal with current timestamp',
      'Unsaved-change form protection and double-submit prevention',
      'Dashboard refinement with concise insight titles and balanced cards',
    ],
  },
  {
    version: 'V3.1.6',
    date: '16 September 2026',
    title: 'Spendly V3.1.6 Stabilization & Parity Release',
    highlights: [
      'Same-version update comparison reporting up to date without modal prompts',
      'Native Android CSV & JSON backup export with file saving and share sheet',
      'Interactive Spendly SVG map markers with Unknown Location details panel',
      'Cleaned and deduplicated chronological version history',
      'Redesigned App Lock settings UI with secure 4-digit PIN setup, removal, and recovery',
      'Consolidated single-badge top header network and cloud sync indicator',
    ],
  },
  {
    version: 'V3.1.5',
    date: '15 September 2026',
    title: 'Update Manifest & Notification Parity',
    highlights: [
      'HTTPS production manifest fetching for native Android update checks',
      'Native Android installed version detection via Capacitor App.getInfo()',
      'Interactive system and version diagnostic modal in Settings',
      'Version-keyed update dismissal preventing stale notification suppression',
    ],
  },
  {
    version: 'V3.1.4',
    date: '15 September 2026',
    title: 'Update Engine Diagnostics & Release Links',
    highlights: [
      'Future release update engine finalization',
      'Runtime diagnostic engine for update discovery',
      'Updated Google Drive APK download link',
    ],
  },
  {
    version: 'V3.1.3',
    date: '15 September 2026',
    title: 'Web & Android Release Parity',
    highlights: [
      'Full Web and Android release parity with monochrome notification icons',
      'Interactive place search and location confirmation in Maps tab',
      'Automated release verification scripts',
    ],
  },
  {
    version: 'V3.1.2',
    date: '15 September 2026',
    title: 'Automatic Sync & Update Experience',
    highlights: [
      'Automatic bidirectional Supabase synchronization',
      'Realtime cloud updates across Web and Android',
      'Improved offline-to-online sync queue handling',
    ],
  },
  {
    version: 'V3.1.1',
    date: '15 September 2026',
    title: 'Sync and Stability Update',
    highlights: [
      'Cloud persistence fixes and parallel IndexedDB hydration',
      'Supabase synchronization performance improvements',
      'Android and Web device stability enhancements',
    ],
  },
  {
    version: 'V3.1.0',
    date: '15 September 2026',
    title: 'Data and Reliability Update',
    highlights: [
      'Offline persistence improvements and IndexedDB storage',
      'Pending sync queue and cloud reconciliation',
      'App update notification system',
    ],
  },
  {
    version: 'V3.0.8',
    date: '15 September 2026',
    title: 'Maps & Usability Finalization',
    highlights: [
      'Added proper Pick on Map option when editing transaction locations',
      'Improved map location search, pin selection, and place editing',
      'Improved Calendar, Categories, Reminders, and Settings usability',
    ],
  },
  {
    version: 'V3.0.0',
    date: '14 September 2026',
    title: 'Spendly V3 Major Release',
    highlights: [
      'New indigo, violet, blue, and cyan visual identity',
      'Glassmorphic UI, Analytics breakdown, Calendar, and Maps',
      'Place search, map pickers, and bill payment reminders',
    ],
  },
  {
    version: 'V2.0.0',
    date: '14 September 2026',
    title: 'Major Architecture & UI Update',
    highlights: [
      'Redesigned glassmorphic personal finance interface',
      'Offline-first architecture with Supabase cloud persistence',
      'Capacitor Android integration',
    ],
  },
  {
    version: 'V1.0.0',
    date: '12 September 2026',
    title: 'Initial Release',
    highlights: [
      'Core personal finance tracking, accounts, income, and expenses',
      'Category monthly budgets and secure authentication',
    ],
  },
];
