---
Task ID: fireflies-clone
Agent: Z.ai Code (main)
Task: Build a functional Fireflies.ai clone — meeting notes & transcription platform with meetings library, interactive transcript, AI summaries, action items, CRUD, search, and dark mode.

Work Log:
- Designed and pushed a Prisma schema (SQLite) with 9 models: User, Person, Meeting, MeetingParticipant, TranscriptSegment, Summary, ActionItem, Topic, Comment, Tag, MeetingTag. Person is reused across meetings so speaker identity is consistent.
- Wrote a rich seed script (prisma/seed.ts) creating 7 fully-populated meetings (Q3 Strategy, Sprint 47 Retro, NorthStar Sales Discovery, Globex Onboarding, Design Critique, Weekly All-Hands, Frontend Interview) each with 17–24 transcript segments, AI summary (overview + key points + decisions), 3–6 action items, 3–5 topic chapters, tags, and one highlight.
- Set up a Fireflies-inspired amber/orange theme in globals.css (light + dark) and a Providers wrapper (TanStack Query + next-themes).
- Built the backend as Next.js Route Handlers under /api: meetings (list/search/filter/sort + create), meetings/[id] (GET/PATCH/DELETE), action-items + comments CRUD, export (txt/md/vtt), search (titles + participants + transcript text), tags, people, stats, summary (LLM regenerate via z-ai-web-dev-sdk), ask (AskFred LLM Q&A over transcript).
- Built the UI shell: firefly-marked Sidebar (nav + AI Add-ons card), Topbar (global search command palette ⌘K, theme toggle, profile), sticky Footer. Single `/` route switches Dashboard↔MeetingDetail via a Zustand store.
- Built the Dashboard: stats row, search + sort + type + tag filters, recency-grouped meeting cards (avatars, tags, counts), empty state, and a Create Meeting dialog (paste `Speaker: text` or WebVTT, or pick a sample template).
- Built the Meeting Detail: media player (simulated playback with seek bar + speed control + waveform), tabbed Summary / Transcript / Tasks / Topics / Notes, an interactive TranscriptView (click-to-seek, active-line highlight synced to currentTime, in-transcript search with match highlighting + next/prev), an ActionItemsPanel (add/complete/reprioritize/delete), a TopicsPanel (clickable chapters), an AskAI chat side panel, Edit + Delete + Export dialogs.
- Shared helpers: format.ts (timestamp/duration/initials), queries.ts (Prisma select fragments), types.ts (API response types).
- Switched the dev server to the native SWC binary (@next/swc-linux-x64-gnu) so Turbopack works in this environment; added allowedDevOrigins to next.config.
- Wrote a comprehensive README (architecture, DB schema, API overview, setup, assumptions).
- Self-verified end-to-end with Agent Browser: dashboard renders all 7 meetings + stats; clicking a card opens the detail with media player, tabs (Transcript/Summary/Tasks/Topics/Notes), interactive transcript (Sarah Chen @ 0:02, etc.), AskFred panel; dark mode toggles to `class="dark"`; VLM confirmed the design reads as a polished, Fireflies-like productivity app.
- Backend verified via curl: /api/meetings (7), /api/stats (253 min, 31 tasks, 6 done), /api/meetings/[id] (24 segments, summary w/ 6 key points + 4 decisions, 6 action items, 5 topics, 5 participants), /api/search?q=NorthStar (4 hits).

Stage Summary:
- All core features implemented and verified: meetings library with search/filter/sort, interactive transcript with click-to-seek + in-transcript search highlighting, AI summary regeneration, action items CRUD, topics/chapters, meeting CRUD, export (txt/md/vtt), global search (⌘K), tags, AskFred LLM chat, dark mode, sticky footer, comments/highlights.
- Lint passes with 0 errors. Dev server runs clean on port 3000.
- Artifacts: prisma/schema.prisma, prisma/seed.ts, src/app/api/**, src/components/{fireflies,dashboard,meeting}/**, src/lib/fireflies/**, src/store/app-store.ts, README.md.
- Known sandbox limitation: background dev-server processes are reaped when the spawning bash session ends; a recurring cron keep-alive is used so the Preview Panel stays live.
