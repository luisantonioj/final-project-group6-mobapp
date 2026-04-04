```markdown
# AnimoQuorum 🗳️

AnimoQuorum is the official mobile voting platform for the DLSL COMELEC, engineered to modernize student elections and maximize voter turnout. Powered by React Native and Supabase, the application features secure real-time voting, an interactive announcement feed, and a community-driven *Miting de Avance* Q&A system.

## 🛠 Tech Stack

* **Frontend Framework:** React Native (via Expo & Expo Router)
* **Backend & Database:** Supabase (PostgreSQL, Row Level Security, RPCs)
* **Server-State Management:** TanStack Query (API Fetching, Caching)
* **Client-State Management:** Zustand (Global UI State, Auth Session)
* **Language:** TypeScript (End-to-End Type Safety)

## 🏗 Architecture & Folder Structure

This repository strictly separates UI screens from business logic. To prevent Expo Router from turning logic files into blank screens, **never use `export default` inside the `hooks/`, `stores/`, or `utils/` folders.**

```text
AnimoQuorum/
├── app/                         ← EXPO ROUTER ONLY (UI Screens & Layouts)
│   ├── providers/               ← TanStack Query setup
│   ├── stores/                  ← Zustand state (authStore, uiStore, votingStore)
│   ├── hooks/                   ← TanStack Query data fetching (useCandidates, useVotes)
│   ├── utils/                   ← Supabase client & generated database types
│   ├── screens/                 ← Complex page components
│   └── components/              ← Reusable UI (Buttons, Cards, Modals)
├── supabase/                    ← BACKEND ONLY (Migrations, RPCs, Policies, Seed Data)
├── .env.local                   ← Ignored by Git (Contains local API keys)
├── .env.local.example           ← Committed to Git (Template for environment variables)
└── package.json                 
```

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a local environment file based on the template:
```bash
cp .env.local.example .env.local
```
Open `.env.local` and add the Dev Project URL and Anon Key from your Supabase Dashboard.

### 3. Start the App
```bash
npm start
```

## 🗄️ Database Management (Supabase CLI)

This project uses a **Cloud-Linked Development** strategy. We do not use local Docker databases (`supabase start` or `db reset`). All schema changes are pushed directly to the linked dev project.

**Push new schema migrations or RPCs to the cloud:**
```bash
npm run db:push
```

**Generate fresh TypeScript types (Run after every database change):**
```bash
npm run db:types
```

## 🔐 Security & Database Rules
* **Row Level Security (RLS):** Enabled on all tables. Students can only insert votes under their own authenticated ID, and can never read the `Votes` table directly.
* **Atomic Transactions:** All critical mutations (Casting a Vote, Deleting a Candidate) are handled entirely server-side via **PostgreSQL RPCs** to prevent race conditions and ensure data integrity.
* **Session Encryption:** User session tokens are secured using AES encryption via `expo-secure-store` and `AsyncStorage` to bypass standard storage limits.
```

***
