# AnimoQuorum 🗳️

AnimoQuorum is the official mobile voting platform for the DLSL COMELEC, engineered to modernize student elections and maximize voter turnout. Powered by React Native and Supabase, the application features secure real-time voting, an interactive announcement feed, and a community-driven *Miting de Avance* Q&A system.

## 🛠 Tech Stack

| Layer | Library | Version |
|---|---|---|
| Mobile Framework | React Native (via Expo) | `0.81.5` / `~54.0.1` |
| Navigation | React Navigation (Native Stack + Bottom Tabs) | `^7.x` |
| Backend & Database | Supabase (PostgreSQL, RLS, RPCs) | `^2.101.1` |
| Server-State | TanStack Query | `^5.96.2` |
| Client-State | Zustand | `^5.0.12` |
| Language | TypeScript | `~5.9.2` |

## 🏗 Architecture & Folder Structure

The project uses **React Navigation** for all routing. The entry point is `index.ts` → `App.tsx` → `RootNavigator`, which mounts either the Student or Admin tab stack based on the authenticated user's role. Business logic is strictly separated from UI screens.

> ⚠️ **Never use `export default`** inside `hooks/`, `stores/`, or `utils/`. These are plain logic folders — accidental default exports can cause React Navigation to treat them as screens.

```text
AnimoQuorum/
├── index.ts                         ← App entry point
├── App.tsx                          ← Supabase auth listener + QueryProvider + RootNavigator
├── app/
│   ├── components/                  ← Reusable UI (CandidateModal, etc.)
│   ├── hooks/                       ← TanStack Query data fetching
│   │   ├── useCandidates.ts
│   │   ├── useMiting.ts
│   │   ├── usePositions.ts
│   │   ├── usePosts.ts
│   │   ├── useSettings.ts
│   │   └── useVotes.ts
│   ├── navigation/                  ← React Navigation stack & tab navigators
│   │   ├── RootNavigator.tsx        ← Auth gate: Splash → Login | Admin | Student tabs
│   │   ├── AppNavigator.tsx         ← Student bottom tabs (Dashboard, Vote, Miting, Profile)
│   │   ├── AdminNavigator.tsx       ← Admin bottom tabs (Overview, Candidates, Results, Settings)
│   │   └── types.ts                 ← Typed param lists for all navigators
│   ├── notifications/
│   │   └── notificationService.ts   ← In-app toast notifications (react-native-toast-message)
│   ├── providers/
│   │   └── QueryProvider.tsx        ← TanStack Query client setup
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboardScreen.tsx
│   │   │   ├── AdminCandidatesScreen.tsx
│   │   │   ├── AdminResultsScreen.tsx
│   │   │   └── AdminSettingsScreen.tsx
│   │   └── student/
│   │       ├── DashboardScreen.tsx
│   │       ├── VoteScreen.tsx
│   │       ├── MitingScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── stores/
│   │   ├── authStore.ts             ← Zustand: session, userProfile, role, splashReady
│   │   └── votingStore.ts           ← Zustand: local ballot selection state
│   └── utils/
│       ├── supabase.ts              ← Supabase client instance
│       └── database.types.ts        ← Auto-generated TypeScript types (do not edit manually)
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/                      ← App logo (logoCrop.png)
├── supabase/
│   ├── migrations/                  ← Versioned SQL: schema, RLS policies, RPCs, realtime, triggers
│   └── seed.sql                     ← Dev seed data
├── .env.local                       ← Ignored by Git (contains local API keys)
├── .env.local.example               ← Committed to Git (env variable template)
└── package.json
```

## 📱 Screen Map

### Student App (4 tabs)
| Tab | Screen | Description |
|---|---|---|
| Home | `DashboardScreen` | Announcement feed, election countdown, live voting board |
| Vote | `VoteScreen` | Ballot with per-position candidate cards and profile modals |
| Miting | `MitingScreen` | Reddit-style live Q&A — submit and upvote questions |
| Profile | `ProfileScreen` | Student profile editor + sign out |

### Admin App (4 tabs)
| Tab | Screen | Description |
|---|---|---|
| Overview | `AdminDashboardScreen` | Election status summary |
| Candidates | `AdminCandidatesScreen` | Add, edit, and remove candidate profiles |
| Results | `AdminResultsScreen` | Real-time vote tally grouped by position |
| Settings | `AdminSettingsScreen` | Control voting window, live results toggle, Miting activation |

## 🔀 Navigation Flow

```
App launches
└── SplashScreen (always plays animation first)
    └── onDone() → RootNavigator checks authStore
        ├── No session         → LoginScreen
        ├── role === 'Admin'   → AdminNavigator (bottom tabs)
        └── role === 'Student' → AppNavigator (bottom tabs)
```

Auth state is managed entirely by `App.tsx`'s `onAuthStateChange` listener. Screens never call `navigate()` to switch between auth states — `RootNavigator` re-renders automatically when `authStore` updates.

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
```bash
cp .env.local.example .env.local
```
Open `.env.local` and fill in your Supabase project URL and anon key from the Supabase Dashboard.

### 3. Start the App
```bash
npm start          # Expo dev server (scan QR with Expo Go)
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

## 🗄️ Database Management (Supabase CLI)

This project uses a **Cloud-Linked Development** strategy — no local Docker database. All schema changes are pushed directly to the linked dev project.

```bash
# Push new migrations or RPCs to the cloud
npm run db:push

# Regenerate TypeScript types after any database change
npm run db:types

# Reset the database to a clean state (dev only)
npm run db:reset
```

> Run `npm run db:types` every time a migration is pushed. The generated file at `app/utils/database.types.ts` must always match the live schema — do not edit it manually.

## 🔐 Security & Database Rules

- **Row Level Security (RLS):** Enabled on all tables. Students can only insert votes under their own authenticated ID and can never query the `Votes` table directly.
- **Atomic Transactions via RPCs:** All critical mutations (casting a vote, invalidating a vote, deleting a candidate) are executed as PostgreSQL RPCs. This prevents race conditions — the app never writes to sensitive tables directly.
- **Vote Integrity Checks (inside `cast_vote` RPC):**
  1. Resolves the caller to an internal `Users.id`
  2. Verifies the voting window is currently open (`SystemSettings`)
  3. Blocks duplicate votes via both a DB constraint and an explicit check
  4. Verifies the candidate belongs to the given position before inserting
- **Session Encryption:** User session tokens are secured with AES encryption via `expo-secure-store` and `AsyncStorage` to bypass standard storage limits.
- **Audit Trail:** Admin actions (invalidating votes, deleting candidates, etc.) are written to `AuditLogs` atomically within the same RPC transaction.
