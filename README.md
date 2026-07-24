# GrowBot 🚀

**Telegram Community Growth & Automated Referral Attribution Platform**

GrowBot helps Telegram community owners grow their groups and channels organically through automated referral campaigns, zero-rate-limit invite attribution via Telegram Mini Apps, anti-cheat fraud prevention, and real-time analytics.

---

## 📌 Table of Contents

- [Vision & Problem Statement](#-vision--problem-statement)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [5-Step Referral Attribution Flow](#-5-step-referral-attribution-flow)
- [Database & Event Sourcing Architecture](#-database--event-sourcing-architecture)
- [Repository Structure](#-repository-structure)
- [Documentation](#-documentation)
- [Getting Started](#-getting-started)

---

## 🎯 Vision & Problem Statement

Telegram lacks built-in tools for organic growth, referral tracking, and attribution. Community managers often struggle with manual invite contests, unverified referral claims, and complex multi-bot setups.

**GrowBot centralizes community growth into three integrated components:**
1. **Telegram Bot** – Handles Telegram webhooks, membership detection (`chat_member`), and community synchronization.
2. **Telegram Mini App** – Provides 1-tap seamless auth (`initDataRaw` HMAC validation), rate-limit-free referral links, and progress tracking.
3. **Web Dashboard** – A centralized Next.js management portal for community administrators to create campaigns, inspect analytics, monitor leaderboards, and fulfill rewards.

---

## ✨ Key Features

- **Multi-Community Workspaces**: Manage multiple Telegram groups and channels under a single dashboard account with workspace tier limits (`FREE`, `PRO`, `ENTERPRISE`).
- **Flexible Campaign Types**:
  - **Milestone Campaigns** (*"Invite 5 friends to unlock VIP access"*).
  - **Leaderboard Competitions** (*"Top inviter wins monthly prize"*).
- **Customizable Referral Validation Rules**:
  - `IMMEDIATE`: Credit referral as soon as member joins.
  - `TIME_BOUND`: Require invitees to remain in the community for a configurable duration (e.g. 24 hours).
  - `MESSAGE_COUNT`: Require invitees to send a minimum number of messages (groups only).
- **Anti-Cheat Credit Revocation**: Automatic tracking of member leaves (`chat_member.status === "left"`) to mark referrals as `REVOKED` and deduct unearned referral credits.
- **Event-Driven Architecture**: All system actions emit immutable `CampaignEvent` records for append-only auditing, analytics, and event-sourcing.

---

## 🛠 Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Web Dashboard** | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query |
| **Backend API** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Cache / Temporary Intent** | Redis (Referral intents, session caching, rate limiting) |
| **Telegram Framework** | Telegram Bot API, Telegram Mini Apps, grammY |
| **Deployment & Ops** | Docker, Docker Compose, Nginx |

---

## ⚡ 5-Step Referral Attribution Flow

```
[ User A Shares Link ] ➔ [ Invitee B Opens Mini App ] ➔ [ HMAC Auth & Redis Intent ] ➔ [ User Joins Group ] ➔ [ Webhook Verifies & Credits ]
```

1. **Link Generation**: Participant shares Mini App referral link (`t.me/GrowBotApp/app?startapp=ref_CODE`) – incurs zero Bot API rate limits.
2. **Launch & Seamless Auth**: Invitee B taps link; Telegram natively opens Mini App. Backend validates `initDataRaw` HMAC-SHA256 signature to verify Telegram ID.
3. **Intent Registration (Redis)**: Invitee taps *"Join Community"*. NestJS registers a temporary key in Redis (`pending_ref:{inviteeId}:{communityChatId}`, 24h TTL) and emits an `INTENT_CREATED` event.
4. **Direct Join & Webhook Sync**: Invitee B joins the Telegram group/channel. Telegram dispatches `chat_member` webhook update to NestJS.
5. **Verification & Anti-Cheat Credit**: Webhook verifies join against Redis intent, records `Referral` in PostgreSQL, emits `REFERRAL_VALIDATED` event, and credits referrer. If Invitee B leaves later, webhook marks referral as `REVOKED` and decrements referral count automatically.

---

## 🗄 Database & Event Sourcing Architecture

Managed via **Prisma ORM** with **PostgreSQL**. Core entities include:

- `User`: Unified profile for admins and members.
- `Workspace`: Multi-community containers with plan limits.
- `Community`: Connected Telegram groups, supergroups, and channels.
- `Campaign`: Referral campaigns (`MILESTONE` or `LEADERBOARD`).
- `CampaignValidationRule`: Normalized validation criteria per campaign.
- `CommunityMember`: Membership state with `first_joined_at` and `rejoined_count` for anti-abuse tracking.
- `CampaignParticipant`: Member referral tokens and validated invite counts.
- `Referral`: Referral records with status transitions (`PENDING_JOIN` -> `VALIDATED` -> `REVOKED`).
- `CampaignEvent`: Immutable event stream (`INTENT_CREATED`, `MEMBER_JOINED`, `REFERRAL_VALIDATED`, `REFERRAL_REVOKED`, `REWARD_EARNED`).
- `Reward`: Reward tracking (`PENDING`, `APPROVED`, `DELIVERED`, `REJECTED`).
- `CommunityDailyStat`: Daily aggregated growth & referral analytics snapshots.
- `TelegramEventLog`: Raw Telegram update audit log.

For the complete schema definition and Prisma configuration, see **[assets/db-design.md](assets/db-design.md)**.

---

## 📂 Repository Structure

```
├── apps/
│   ├── api/            # Backend API (NestJS), Telegram Bot & Redis Attribution Engine
│   └── web/            # Web Dashboard (Next.js) & Telegram Mini App Frontend
├── packages/
│   ├── database/       # Prisma ORM schema, PostgreSQL migrations & Redis client
│   └── typescript-config# Shared TypeScript configurations
├── doc/
│   ├── phase-1.md      # Product Vision, Scope & Phase 1 Specifications
│   ├── db-design.md    # Detailed Database Architecture & Prisma Schema Spec
│   ├── plan.md         # Master Implementation Roadmap (Phases 1 - 7)
│   └── git-guildeline.md # Git Branching Strategy & Developer Workflow Guidelines
└── README.md           # Project Overview & System Architecture Documentation
```

---

## 📚 Documentation

- 📋 **[Phase 1 Scope & Specification](doc/phase-1.md)**: Product goals, functional requirements, non-functional requirements, and MVP scope.
- 🗄 **[Database Specification & Prisma Schema](doc/db-design.md)**: Entity Relationship Diagram (ERD), full Prisma schema code, indexing strategies, and Redis caching architecture.
- 🗺 **[Master Execution Plan](doc/plan.md)**: Master implementation roadmap broken down by phase and module.
- 🌿 **[Git Branching & Workflow Guidelines](doc/git-guildeline.md)**: Monorepo Git setup, branch hierarchy, conventional commits, and developer cheat sheet.

---

## 🚀 Getting Started

*(Development setup & docker configuration instructions will be added as backend and frontend services are initialized.)*

---

## 📄 License

Internal / Private Development. All rights reserved.
