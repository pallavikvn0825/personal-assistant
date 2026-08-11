# Focus — Personal Productivity Assistant

A personalized daily and weekly accountability assistant that helps you plan your day, track goals, maintain habits, and stay on track.

## Architecture

```
Next.js 15 (App Router) + TypeScript
├── Prisma ORM + SQLite (dev) / PostgreSQL (prod)
├── Tailwind CSS 4
├── Server Components + Server Actions
└── Service Layer (business logic separated from UI)
    ├── tasks.ts       — CRUD, sorting, dashboard groups
    ├── recurring.ts   — Recurrence engine with RRULE support
    ├── planning.ts    — Workload analysis, daily planning
    ├── reminders.ts   — Notification architecture (extensible)
    ├── goals.ts       — Goals, projects, analytics
    ├── habits.ts      — Habit tracking with streaks
    └── ai/index.ts    — AI service interfaces (stubs for Phase 3)
```

### Data Model

Goal → Project → Task → Subtask (hierarchical)
Task + TaskInstance (for recurring tasks — no duplicate data)
Habit + HabitCompletion (separate from tasks)
UserSettings, Reminder, Notification, DailyReview, WeeklyReview

### Workflow

**Plan → Remind → Work → Complete → Review → Replan**

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Set up database and seed demo data
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:./dev.db"
DEFAULT_USER_EMAIL="me@example.com"
DEFAULT_USER_NAME="You"
```

## Features

### Phase 1 (MVP) — Implemented
- Dashboard with morning greeting, today's overview, top priority
- Task CRUD with priorities, due dates, categories, projects
- Recurring tasks (daily, weekdays, weekly, custom)
- Today page with intelligent task ordering and workload analysis
- Weekly goal progress tracking
- Productivity streak tracking
- Basic reminder architecture
- Settings (profile, planning, notifications, theme)

### Phase 2 — Implemented
- Goals & Projects hierarchy with progress
- Habit tracking with streaks and weekly consistency
- Calendar view (month/week)
- Daily end-of-day review
- Weekly review
- Analytics dashboard
- Global search and filtering on tasks page

### Phase 3 — Architecture Ready
- Natural language task parsing (interface + stub)
- AI daily/weekly planning (interface + stub)
- AI prioritization and insights (interface + stub)
- Smart rescheduling (interface + stub)

Connect an LLM provider by implementing the interfaces in `src/lib/services/ai/index.ts`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — morning overview |
| `/today` | Today's plan with workload analysis |
| `/tasks` | All tasks with search/filter |
| `/goals` | Goals and projects |
| `/habits` | Habit tracking |
| `/calendar` | Calendar view |
| `/analytics` | Productivity analytics |
| `/review/daily` | End-of-day review |
| `/review/weekly` | Weekly review |
| `/settings` | Profile, planning, notifications |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed demo data
npm run db:setup     # Push + seed
```
