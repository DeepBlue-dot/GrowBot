# GrowBot 🚀

**Telegram Community Growth & Automated Referral Attribution Platform**

GrowBot helps Telegram community owners grow their groups and channels organically through automated referral campaigns, zero-rate-limit invite attribution via Telegram Mini Apps, anti-cheat fraud prevention, real-time analytics, and automated bot announcements.

---

## 📌 Table of Contents

- [Vision & Architecture](#-vision--architecture)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [5-Step PostgreSQL Attribution Flow](#-5-step-postgresql-attribution-flow)
- [Database & Event Sourcing Architecture](#-database--event-sourcing-architecture)
- [Completed Implementation Progress (Phases 1 - 5)](#-completed-implementation-progress-phases-1---5)
- [Repository Structure](#-repository-structure)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Documentation](#-documentation)

---

## 🎯 Vision & Architecture

Telegram lacks built-in tools for organic growth, referral tracking, and attribution. Community managers often struggle with manual invite contests, unverified referral claims, and complex multi-bot setups.

**GrowBot centralizes community growth into three integrated components:**
1. **Telegram Bot (`apps/api`)** – Built with NestJS and grammY. Handles Telegram webhooks, membership detection (`chat_member`), community synchronization, campaign announcements, milestone congratulations, and reward DMs.
2. **Telegram Mini App (`apps/web/src/views/MiniAppView.vue`)** – Provides 1-tap seamless auth (`initDataRaw` HMAC validation), rate-limit-free referral links, invitee landing cards, and participant progress views.
3. **Web Dashboard (`apps/web`)** – A Vue 3 + Pinia + Tailwind CSS management portal for community administrators to authenticate via Telegram Widget, create campaigns, inspect daily growth analytics, monitor leaderboards, fulfill rewards, and export CSV reports.

---

## ✨ Key Features

- **Multi-Community Workspaces**: Manage multiple Telegram groups and channels under a single dashboard account with workspace tier limits (`FREE`, `PRO`, `ENTERPRISE`).
- **Flexible Campaign Types**:
  - **Milestone Campaigns** (*"Invite 5 friends to unlock VIP access"*).
  - **Leaderboard Competitions** (*"Top inviter wins monthly prize"*).
- **Customizable Anti-Cheat Validation Rules**:
  - `IMMEDIATE`: Credit referral as soon as member joins.
  - `TIME_BOUND`: Require invitees to remain in the community for a configurable duration (e.g. 24 hours).
  - `MESSAGE_COUNT`: Require invitees to send a minimum number of messages (groups only).
- **Anti-Cheat Credit Revocation**: Automatic tracking of member leaves (`chat_member.status === "left"`) to mark referrals as `REVOKED` and deduct unearned referral credits.
- **Event-Driven Architecture**: All system actions emit immutable `CampaignEvent` records for append-only auditing, analytics, and event-sourcing.
- **Bot Announcements & Notifications**:
  - Auto-posts launch announcements when campaigns are activated (`ACTIVE`).
  - Sends congratulatory messages in group chats when members hit milestones.
  - Sends direct message (DM) notifications when rewards are approved or delivered.
- **Daily Analytics & Growth Velocity Chart**: Aggregates daily joins, departures, total referrals, and validated referrals (`CommunityDailyStat`) with 7D / 30D / 90D range selectors.
- **1-Click CSV Export**: Instant export of participant rankings, referral counts, and reward status via `GET /api/campaigns/:id/export`.

---

## 🛠 Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Web Dashboard & Mini App** | Vue 3, Vite, Pinia, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend API** | NestJS, TypeScript, Prisma ORM, grammY |
| **Database** | PostgreSQL |
| **Monorepo Tools** | Turborepo, pnpm workspaces |
| **Telegram Integration** | Telegram Bot API, Telegram Mini Apps, Telegram Login Widget |
| **Deployment & Ops** | Vercel (Serverless NestJS & Static Vue 3) |

---

## ⚡ 5-Step PostgreSQL Attribution Flow

```
[ User A Shares Link ] ➔ [ Invitee B Opens Mini App ] ➔ [ HMAC Auth & Intent ] ➔ [ User Joins Group ] ➔ [ Webhook Verifies & Credits ]
```

1. **Link Generation**: Participant shares Mini App referral link (`t.me/GrowBotApp/app?startapp=ref_CODE`) – incurs zero Bot API rate limits.
2. **Launch & Seamless Auth**: Invitee B taps link; Telegram natively opens Mini App. Backend validates `initDataRaw` HMAC-SHA256 signature to verify Telegram ID.
3. **Intent Registration**: Invitee taps *"Join Community"*. NestJS registers `Referral` intent in PostgreSQL (`status: PENDING_JOIN`) and emits an `INTENT_CREATED` event.
4. **Direct Join & Webhook Sync**: Invitee B joins the Telegram group/channel. Telegram dispatches `chat_member` webhook update to NestJS.
5. **Verification & Anti-Cheat Credit**: Webhook verifies join against intent, updates `Referral` to `VALIDATED` in PostgreSQL, emits `REFERRAL_VALIDATED` event, increments `validatedReferrals`, and credits referrer. If Invitee B leaves later, webhook marks referral as `REVOKED` and decrements referral count automatically.

---

## 📊 Completed Implementation Progress (Phases 1 - 5)

- [x] **Phase 1: Core Backend Pipeline & Prisma Event Sourcing**
  - PostgreSQL persistence for referrals (`PENDING_JOIN`, `VALIDATED`, `REVOKED`), member joins/leaves (`CommunityMember`), and immutable `CampaignEvent` sourcing.
- [x] **Phase 2: Campaign Engine & Reward Auto-Creation**
  - Full Campaign CRUD API (`POST`, `GET`, `PATCH`, `DELETE` `/api/campaigns`), validation rules, and automatic milestone reward creation.
- [x] **Phase 3: Telegram Mini App**
  - WebApp WebView route (`/miniapp`), auto-auth with `initDataRaw`, referral link generation & share flow, invitee landing card, and progress tracking.
- [x] **Phase 4: Dashboard Authentication & CRUD UI**
  - Telegram Login Widget & Dev Login (`/login`), JWT token persistence, Vue Router auth guards, Campaign Builder wizard, and Reward Fulfillment queue.
- [x] **Phase 5: Notifications & Analytics**
  - `CommunityDailyStat` metric writer, live Growth Velocity Chart (7D/30D/90D filters), Bot group announcements & milestone DMs, and 1-Click CSV export (`GET /api/campaigns/:id/export`).

---

## 📂 Repository Structure

```
├── apps/
│   ├── api/            # Backend API (NestJS), Telegram Bot & Attribution Engine
│   └── web/            # Web Dashboard (Vue 3 + Vite) & Telegram Mini App Frontend
├── packages/
│   ├── database/       # Prisma ORM schema & PostgreSQL migrations
│   └── typescript-config# Shared TypeScript configurations
├── doc/
│   ├── phase-1.md      # Product Vision, Scope & Phase 1 Specifications
│   ├── db-design.md    # Detailed Database Architecture & Prisma Schema Spec
│   ├── plan.md         # Master Implementation Roadmap (Phases 1 - 6)
│   └── git-guildeline.md # Git Branching Strategy & Developer Workflow Guidelines
└── README.md           # Project Overview & System Architecture Documentation
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js >= 18.x
- pnpm >= 9.x
- PostgreSQL database instance

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone git@github.com:DeepBlue-dot/GrowBot.git
   cd InviteBot
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in `apps/api/.env` and specify `DATABASE_URL` and `TELEGRAM_BOT_TOKEN`.

4. **Run Database Migrations:**
   ```bash
   pnpm --filter @growbot/database exec prisma migrate dev
   ```

5. **Start Local Development Server:**
   ```bash
   pnpm dev
   ```
   - **Web Dashboard & Mini App**: `http://localhost:5173`
   - **Backend API**: `http://localhost:3000/api`

6. **Run Build & Test Verification:**
   ```bash
   pnpm build
   pnpm --filter api test
   ```

---

## 📚 Documentation

- 📋 **[Phase 1 Scope & Specification](doc/phase-1.md)**: Product goals, functional requirements, and MVP scope.
- 🗄 **[Database Specification & Prisma Schema](doc/db-design.md)**: Entity Relationship Diagram (ERD), full Prisma schema code, indexing strategies, and PostgreSQL intent pipeline.
- 🗺 **[Master Execution Plan](doc/plan.md)**: Master implementation roadmap (Phases 1 - 6).
- 🌿 **[Git Branching & Workflow Guidelines](doc/git-guildeline.md)**: Monorepo Git setup, branch hierarchy, conventional commit standards, and developer workflows.

---

## 📄 License

Internal / Private Development. All rights reserved.
