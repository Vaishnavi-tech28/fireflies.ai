# Fireflies — Meeting Notes & Transcription Platform

A functional clone of [Fireflies.ai](https://fireflies.ai) — a meeting-assistant
web app. Browse a library of meetings, read **interactive transcripts** with
speaker labels and timestamps that seek a media player, review **AI-generated
summaries, action items, and topics**, search across everything, and manage
meetings end-to-end (CRUD). The app ships with seeded data so it's immediately
usable.

> Real speech-to-text is out of scope per the assignment. Transcription and AI
> summaries are **seeded**, **pasted/uploaded**, or **LLM-generated from
> existing transcript text**.

---

## ✨ Features

### Core

- **Meetings Library / Dashboard** — grouped-by-recency cards with title, date,
  duration, participants, tags, and counts. Search, filter (type / tag /
  participant), and sort (recent / oldest / longest / shortest / A–Z).
- **Meeting / Transcript Detail** — a sticky media player with a seek bar and
  speed control drives an **interactive transcript**: click any line to seek,
  and the active line auto-highlights as the player advances. In-transcript
  search shows match count, next/prev navigation, and highlighted matches.
- **AI Summary & Notes** — overview, key points, decisions, and clickable
  topic chapters anchored to timestamps. Summaries can be regenerated from the
  transcript at any time with the LLM.
- **Meeting Management (CRUD)** — create a meeting by pasting a transcript
  (plain `Speaker: text` lines or WebVTT), edit metadata (title, participants,
  type, date), delete, and manage action items (add / complete / reprioritize /
  delete). Private notes persist per meeting.
- **Fireflies Experience** — firefly-marked sidebar, AskFred AI chat side panel,
  toasts, global search command palette (⌘K), dark mode, sticky footer.

### Bonus

- **Comments / highlights / soundbites** on transcript segments.
- **Export** a meeting as TXT, Markdown, or WebVTT.
- **Global search** across all meetings *and* transcript text (jumps to the
  matching timestamp when opened from search).
- **Tags** with colored chips and dashboard filtering.
- **AskFred** — LLM-powered "ask a question about this meeting" chat grounded
  in the transcript, citing `[m:ss]` timestamps.
- **Dark mode** with a warm amber/orange Fireflies palette.

### Placeholders (marked "Soon")

Real-time bot joining calls, actual speech-to-text, integrations (Zoom / Meet /
CRM), team collaboration, and real user authentication (a default user is
assumed).

---

## 🧱 Tech Stack

| Layer        | Choice                                                            |
| ------------ | ----------------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router) + **TypeScript 5**                    |
| Styling      | **Tailwind CSS 4** + **shadcn/ui** (New York) + Lucide icons      |
| Data fetching| **TanStack Query v5** for server state, **Zustand** for view state|
| Theming      | **next-themes** (light/dark)                                       |
| Database     | **SQLite** via **Prisma ORM 6**                                    |
| AI           | **z-ai-web-dev-sdk** (LLM chat completions) — backend only         |

> The assignment brief lists Python/FastAPI for the backend. This environment
> is a Next.js-only sandbox, so the backend is implemented as **Next.js Route
> Handlers** (the Next.js App-Router equivalent of a REST API) backed by
> Prisma + SQLite. The data model, REST-style endpoints, and separation of
> concerns mirror a clean FastAPI design.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Browser  (single user-facing route: /)                       │
│  ┌────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Sidebar   │  │  Topbar (global search ⌘K, theme, +New)  │ │
│  │            │  ├──────────────────────────────────────────┤ │
│  │  nav +     │  │  <main>                                  │ │
│  │  sections  │  │   Zustand view-state switches between:   │ │
│  │            │  │     • Dashboard (library)               │ │
│  │            │  │     • MeetingDetail (player + tabs)     │ │
│  │            │  ├──────────────────────────────────────────┤ │
│  │            │  │  Footer (sticky)                         │ │
│  └────────────┘  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
            │ fetch('/api/…')           (TanStack Query)
            ▼
┌──────────────────────────────────────────────────────────────┐
│  Next.js Route Handlers  (src/app/api/**)  — the "backend"   │
│   meetings · meetings/[id] · action-items · comments · search │
│   tags · people · stats · meetings/[id]/export · summary · ask│
└──────────────────────────────────────────────────────────────┘
            │ Prisma Client
            ▼
┌──────────────────────────────────────────────────────────────┐
│  SQLite (db/custom.db)                                        │
└──────────────────────────────────────────────────────────────┘
```

**Why a single `/` route?** The sandbox only exposes one user-facing route.
View switching (Dashboard ↔ Meeting detail) is handled client-side via a
Zustand store (`src/store/app-store.ts`). Deep-linking to a transcript hit is
done through `sessionStorage` so opening from global search seeks the player.

**Playback model.** Since real audio is out of scope, the media player is a
**simulated player** (`usePlayback`) that advances `currentTime` while
"playing", exposing `seek/play/pause/skip/setRate`. It behaves identically to a
real `<audio>` element for the interactive transcript, topics, and global
search seek.

---

## 🗄️ Database Schema

SQLite via Prisma. Full schema in [`prisma/schema.prisma`](./prisma/schema.prisma).

```
User            1───* Meeting (organizer)
Person          1───* MeetingParticipant *──1 Meeting
Person          1───* TranscriptSegment *──1 Meeting
Meeting         1───1 Summary
Meeting         1───* ActionItem
Meeting         1───* Topic
Meeting         1───* Comment ──? TranscriptSegment
Meeting         *───* Tag  (via MeetingTag)
```

| Model                | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `User`               | The logged-in account holder (single default user).                      |
| `Person`             | A real-world speaker/participant, **reused across meetings** so identity is consistent. |
| `Meeting`            | Central entity — title, date, duration, source, type, notes.            |
| `MeetingParticipant` | Join table with a role (host/attendee).                                  |
| `TranscriptSegment`  | One transcript line: speaker, `startTime`/`endTime` (seconds), text. Indexed by `(meetingId, startTime)`. |
| `Summary`            | One-per-meeting AI summary: `overview` (markdown), `keyPoints` + `decisions` (JSON strings, since SQLite has no array type). |
| `Topic`              | Chapter / outline entry anchored to a timestamp.                         |
| `ActionItem`         | Task: text, assignee, priority, dueDate, completed.                      |
| `Comment`            | Comment / highlight / soundbite attached to a segment and/or time range. |
| `Tag` / `MeetingTag` | Many-to-many colored tags for filtering.                                  |

---

## 🔌 API Overview

All endpoints are Next.js Route Handlers under `src/app/api/**`. Standard REST
semantics; JSON in/out.

| Method | Path                                  | Purpose                                          |
| ------ | ------------------------------------- | ------------------------------------------------ |
| GET    | `/api/meetings`                       | List + search (`q`) + filter (`type`,`tag`,`participant`) + `sort` |
| POST   | `/api/meetings`                       | Create a meeting (paste text, WebVTT, or segments) |
| GET    | `/api/meetings/[id]`                  | Full detail: participants, segments, summary, action items, topics, comments, tags |
| PATCH  | `/api/meetings/[id]`                  | Update title / type / date / participants / notes |
| DELETE | `/api/meetings/[id]`                  | Delete a meeting and all related data            |
| POST   | `/api/meetings/[id]/action-items`    | Add an action item                               |
| PATCH  | `/api/action-items/[id]`             | Toggle complete / edit / reprioritize             |
| DELETE | `/api/action-items/[id]`             | Delete an action item                            |
| POST   | `/api/meetings/[id]/comments`        | Add a comment / highlight / soundbite            |
| PATCH  | `/api/comments/[id]`                 | Edit a comment                                   |
| DELETE | `/api/comments/[id]`                 | Delete a comment                                 |
| GET    | `/api/meetings/[id]/export?format=`   | Export as `txt` / `md` / `vtt`                   |
| POST   | `/api/meetings/[id]/summary`         | **LLM** regenerate summary + key points + decisions from transcript |
| POST   | `/api/meetings/[id]/ask`              | **LLM** "AskFred" — answer a question over the transcript, with history |
| GET    | `/api/search?q=`                      | Global search across titles, participants, AND transcript text |
| GET    | `/api/tags`                           | List tags with counts                            |
| GET    | `/api/people`                         | List people (for pickers)                        |
| GET    | `/api/stats`                          | Dashboard header numbers                         |

---

## 🚀 Setup

### Prerequisites

- Node.js 20+ and npm (Bun also works)
- Nothing else — SQLite is a file database, no separate server.

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Configure the local SQLite database
cp .env.example .env

# 3. Create the SQLite database + apply schema
npm run db:push

# 4. Seed rich demo data (7 meetings, full transcripts, summaries, action items, topics, tags)
npm run db:seed

# 5. Start the dev server
npm run dev     # -> http://localhost:3000
```

Open `http://localhost:3000` to use the app. Bun can be used instead of npm
where preferred.

### Lint / build

```bash
npm run lint
npm run build
```

### Environment

Set `DATABASE_URL` in `.env` (copy `.env.example` for local development):

```
DATABASE_URL="file:./db/custom.db"
```

### Production runtime

The production build uses Next.js standalone output. `npm run build` prepares
the standalone server and copies its static assets; `npm run start` launches
that server. For hosting, set `DATABASE_URL` to an absolute SQLite path on a
persistent writable disk (for example, `file:/var/data/custom.db`). The
platform's ephemeral filesystem is not suitable for the database. Initialize
an empty database with `npm run db:push`; optionally run `npm run db:seed` once
to load demo content. Seeding replaces existing meetings and should not be
rerun against data you want to keep.

---

## 📁 Project Structure

```
prisma/
  schema.prisma          # DB schema
  seed.ts                # Seed script (7 meetings)

src/
  app/
    api/                # Route Handlers (the "backend")
      meetings/
        [id]/
          action-items/
          comments/
          export/
          summary/      # LLM regenerate
          ask/          # LLM AskFred
      action-items/[id]/
      comments/[id]/
      search/
      tags/
      people/
      stats/
    globals.css         # Fireflies amber palette + transcript highlight styles
    layout.tsx          # Root layout + providers
    page.tsx            # Single user route → <AppShell />
  components/
    providers/          # TanStack Query + next-themes
    fireflies/          # Shell: sidebar, topbar, footer, global search, theme toggle, avatar, logo
    dashboard/          # Dashboard, meeting card, stats, create dialog
    meeting/            # MeetingDetail, media player, transcript view, summary/actions/topics panels, AskFred, edit/comment dialogs
    ui/                 # shadcn/ui (preinstalled)
  lib/
    db.ts               # Prisma client singleton
    utils.ts            # cn()
    fireflies/
      format.ts         # time/date/duration/initials helpers
      queries.ts        # shared Prisma select fragments
      types.ts          # API response types
  store/
    app-store.ts        # Zustand view state (dashboard ↔ meeting)
```

---

## 🤖 AI Usage

LLM calls (via `z-ai-web-dev-sdk`) run **only on the backend**:

1. **`POST /api/meetings/[id]/summary`** — sends the full transcript with a
   strict "respond with JSON only" prompt, parses overview / keyPoints /
   decisions, and upserts the `Summary` row. Tolerant of ```json fences.
2. **`POST /api/meetings/[id]/ask`** — builds a system prompt containing the
   transcript (and existing summary), supports multi-turn history, and
   instructs the model to cite `[m:ss]` timestamps and answer from the
   transcript only.

The frontend surfaces these as the **"Regenerate"** button on the summary panel
and the **AskFred** chat in the meeting detail side panel.

---

## 📝 Assumptions

- A single default user (`you@fireflies.app`) is assumed to be logged in; real
  auth is explicitly out of scope.
- Transcription data is **seeded** or **pasted in** (plain `Speaker: text` or
  WebVTT). No real speech-to-text is performed.
- The media player is **simulated** — it advances playback time so the
  interactive transcript, topics, and global-search-seek all work end-to-end.
  A real audio file could be wired into `Meeting.audioUrl` without changing the
  playback contract.
- AI summaries and AskFred answers are LLM-generated from existing transcript
  text (not from audio).
- The backend uses Next.js Route Handlers (the only backend this sandbox
  supports) — the REST design, schema, and separation of concerns are
  equivalent to a clean FastAPI service.

---

## 📜 License

Built as a take-home assignment. Original work — no code was copied from
existing Fireflies clones.
