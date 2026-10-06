// =============================================================
// Seed script for the Fireflies clone.
// Run with: bun run prisma/seed.ts
// Creates a default user, a pool of reusable people, tags,
// and several fully-populated meetings (transcript, summary,
// action items, topics, comments).
// =============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---- helpers --------------------------------------------------
const COLORS = [
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#0ea5e9",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

function hhmmss(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `00:${m}:${s}`;
}

// Speaker pool (reused across meetings)
type SpeakerSeed = {
  name: string;
  email: string;
  color: string;
  title: string;
};

const PEOPLE: SpeakerSeed[] = [
  { name: "Sarah Chen", email: "sarah@acme.co", color: COLORS[0], title: "Head of Product" },
  { name: "Mike Rodriguez", email: "mike@acme.co", color: COLORS[1], title: "Engineering Lead" },
  { name: "Priya Patel", email: "priya@acme.co", color: COLORS[2], title: "Design Lead" },
  { name: "David Kim", email: "david@acme.co", color: COLORS[3], title: "CEO" },
  { name: "Alex Turner", email: "alex@acme.co", color: COLORS[4], title: "Product Manager" },
  { name: "Jenna Brooks", email: "jenna@acme.co", color: COLORS[5], title: "Sales Director" },
  { name: "Tom Walsh", email: "tom@acme.co", color: COLORS[6], title: "Customer Success" },
  { name: "Emma Liu", email: "emma@acme.co", color: COLORS[7], title: "Senior Designer" },
  { name: "James Park", email: "james@acme.co", color: COLORS[8], title: "Backend Engineer" },
  { name: "Olivia Foster", email: "olivia@northstar.io", color: COLORS[2], title: "VP Operations (NorthStar)" },
  { name: "Ryan Mitchell", email: "ryan@northstar.io", color: COLORS[5], title: "CTO (NorthStar)" },
  { name: "Nina Kapoor", email: "nina@globex.com", color: COLORS[3], title: "Operations Lead (Globex)" },
  { name: "Marcus Webb", email: "marcus@globex.com", color: COLORS[1], title: "Finance Director (Globex)" },
  { name: "Liam Bennett", email: "liam@acme.co", color: COLORS[6], title: "Frontend Engineer" },
  { name: "Sophia Reyes", email: "sophia@acme.co", color: COLORS[4], title: "Growth Marketing" },
];

// Segments are [speakerName, startSec, endSec, text]
type Seg = [string, number, number, string];

function buildSegs(meetingId: string, personIds: Record<string, string>, segs: Seg[]) {
  return segs.map(([speaker, start, end, text]) => ({
    meetingId,
    speakerId: personIds[speaker],
    startTime: start,
    endTime: end,
    text,
    confidence: 0.92 + Math.random() * 0.07,
  }));
}

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Default logged-in user
  const me = await db.user.upsert({
    where: { email: "you@fireflies.app" },
    update: {},
    create: {
      email: "you@fireflies.app",
      name: "You",
      role: "user",
      avatarUrl: null,
    },
  });

  // 2. People pool
  const personIds: Record<string, string> = {};
  for (const p of PEOPLE) {
    const person = await db.person.upsert({
      where: { email: p.email },
      update: { name: p.name, avatarColor: p.color, title: p.title },
      create: {
        name: p.name,
        email: p.email,
        avatarColor: p.color,
        title: p.title,
      },
    });
    personIds[p.name] = person.id;
  }

  // 3. Tags
  const tagDefs = [
    { name: "Roadmap", color: "#f59e0b" },
    { name: "Sales", color: "#ef4444" },
    { name: "Engineering", color: "#10b981" },
    { name: "Design", color: "#8b5cf6" },
    { name: "Customer", color: "#0ea5e9" },
    { name: "Quarterly", color: "#ec4899" },
    { name: "Interview", color: "#f97316" },
    { name: "Retro", color: "#14b8a6" },
  ];
  const tagIds: Record<string, string> = {};
  for (const t of tagDefs) {
    const tag = await db.tag.upsert({
      where: { name: t.name },
      update: { color: t.color },
      create: t,
    });
    tagIds[t.name] = tag.id;
  }

  // Wipe existing meetings (idempotent re-seed)
  await db.meetingTag.deleteMany({});
  await db.comment.deleteMany({});
  await db.actionItem.deleteMany({});
  await db.topic.deleteMany({});
  await db.summary.deleteMany({});
  await db.transcriptSegment.deleteMany({});
  await db.meetingParticipant.deleteMany({});
  await db.meeting.deleteMany({});

  // ----------------------------------------------------------
  // Meeting 1 — Q3 Product Strategy Sync
  // ----------------------------------------------------------
  const m1 = await db.meeting.create({
    data: {
      title: "Q3 Product Strategy Sync",
      date: new Date(Date.now() - 1000 * 60 * 60 * 26),
      durationSec: 2880, // 48 min
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Internal Call",
      notes: "Decision: ship onboarding revamp before Q3 end.",
      participants: {
        create: [
          { personId: personIds["Sarah Chen"], role: "host" },
          { personId: personIds["Mike Rodriguez"] },
          { personId: personIds["Priya Patel"] },
          { personId: personIds["David Kim"] },
          { personId: personIds["Alex Turner"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Roadmap"] }, { tagId: tagIds["Quarterly"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m1.id, personIds, [
      ["Sarah Chen", 2, 14, "Alright everyone, thanks for hopping on. Today we're locking down the Q3 product strategy. We have about forty five minutes."],
      ["Sarah Chen", 16, 26, "I want to cover three things — our top priority bets, engineering capacity, and the hiring plan to support all of it."],
      ["David Kim", 28, 42, "Great. From the leadership side the number one ask is the onboarding revamp. Activation dropped three points last month and we need to recover before the Q3 board review."],
      ["Alex Turner", 44, 60, "I pulled the numbers. Thirty eight percent of new users churn in the first week, and most of them never create a second project. Onboarding is clearly the leak."],
      ["Mike Rodriguez", 62, 78, "We can absolutely take that on. The team velocity has been solid — we closed forty one story points last sprint, which is our highest in three months."],
      ["Mike Rodriguez", 80, 95, "But I want to be honest about scope. If we do onboarding properly — guided tour, empty states, the analytics — that's roughly three sprints of work."],
      ["Priya Patel", 97, 112, "On the design side, Emma has the new onboarding flow mostly mocked. The big open question is whether we keep the three step wizard or move to a single canvas."],
      ["Sarah Chen", 114, 128, "Let's decide that today. I lean toward the canvas approach — it matches the rest of the product and reduces drop off."],
      ["David Kim", 130, 142, "I agree. Canvas. The wizard always felt bolted on."],
      ["Priya Patel", 144, 156, "Perfect. I'll have Emma finalize the canvas flow by end of week and we can review in next Tuesday's critique."],
      ["Alex Turner", 158, 174, "Second bet — I think we should invest in the integrations marketplace. The data shows users with two or more integrations retain at four times the rate."],
      ["Mike Rodriguez", 176, 190, "That tracks with what we saw last quarter. The Slack integration alone moved retention by eleven percent."],
      ["Sarah Chen", 192, 205, "Agreed, but integrations is a big surface area. Mike, can we scope a v1 that's just three new integrations — Slack, Jira, and Linear?"],
      ["Mike Rodriguez", 207, 224, "Yeah. James has been asking to own something end to end. I'd give him Slack and Linear, and we can contract the Jira one out to save time."],
      ["David Kim", 226, 240, "Budget approved for the contractor. Let's keep it under fifteen thousand for the Jira piece."],
      ["Priya Patel", 242, 256, "For the marketplace UI, I can reuse the patterns from the template gallery. That should cut design time significantly."],
      ["Sarah Chen", 258, 272, "Great. So onboarding revamp is bet one, integrations marketplace is bet two. Any objections? No? Good."],
      ["Alex Turner", 274, 290, "Third bet — and this is more experimental — I'd love to run an AI summary prototype for power users. The transcripts are sitting there, we should mine them."],
      ["Mike Rodriguez", 292, 306, "That's interesting but I'm worried about the LLM cost. We need to model the per user token spend before committing."],
      ["David Kim", 308, 322, "Let's prototype it on the internal account first. No real users, no cost risk. If the quality is there we revisit in two weeks."],
      ["Sarah Chen", 324, 338, "Sounds like a plan. Action items — Priya to finalize the onboarding canvas by Friday, Mike to scope integrations v1, Alex to draft the AI summary spec."],
      ["Mike Rodriguez", 340, 354, "On hiring — I have two open frontend requisitions and one backend. I'd like to close at least one frontend before end of Q3."],
      ["David Kim", 356, 370, "I'll fast track the frontend candidates. We have a strong one coming in Thursday — Liam's referral, looks solid."],
      ["Sarah Chen", 372, 386, "Alright, let's regroup next Monday with concrete sprint plans. Thanks everyone, really productive session."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m1.id,
      overview:
        "The team locked down three strategic bets for Q3: (1) a full onboarding revamp moving from a 3-step wizard to a single canvas, driven by an activation drop of 3 points; (2) an integrations marketplace v1 shipping Slack, Linear, and Jira connectors, with James owning Slack+Linear and a contracted Jira build under a $15k budget; and (3) an experimental AI summary prototype trialed internally before any external rollout. Leadership also committed to fast-tracking frontend hiring, with one strong candidate interviewing Thursday.",
      keyPoints: JSON.stringify([
        "Activation dropped 3 points; 38% of new users churn in week one — onboarding is the leak.",
        "Decision: move from 3-step wizard to a single canvas onboarding flow.",
        "Integrations marketplace v1 = Slack (James), Linear (James), Jira (contractor, < $15k).",
        "AI summary prototype to run on internal accounts first, revisited in 2 weeks.",
        "Engineering velocity at 41 story points/sprint — highest in 3 months.",
        "Two open frontend reqs + one backend; fast-track Thursday candidate.",
      ]),
      decisions: JSON.stringify([
        "Canvas onboarding flow approved (replacing the wizard).",
        "Integrations marketplace v1 scoped to Slack, Linear, Jira only.",
        "$15k budget approved for contracted Jira integration.",
        "AI summary runs internally first, no external users until reviewed.",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m1.id, name: "Welcome & Agenda", startTime: 2, endTime: 26, summary: "Sarah sets the agenda: Q3 priorities, engineering capacity, hiring." },
      { meetingId: m1.id, name: "Bet 1 — Onboarding Revamp", startTime: 28, endTime: 156, summary: "Activation dropped 3pts; 38% churn in week one. Decision: move to single canvas flow." },
      { meetingId: m1.id, name: "Bet 2 — Integrations Marketplace", startTime: 158, endTime: 256, summary: "Slack, Linear, Jira scoped for v1. James owns Slack+Linear, Jira contracted < $15k." },
      { meetingId: m1.id, name: "Bet 3 — AI Summary Prototype", startTime: 274, endTime: 322, summary: "Prototype on internal accounts only; revisit in 2 weeks." },
      { meetingId: m1.id, name: "Hiring & Wrap Up", startTime: 340, endTime: 386, summary: "Two frontend + one backend req open. Strong Thursday candidate via Liam's referral." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m1.id, text: "Finalize onboarding canvas flow mockups", assignee: "Priya Patel", assigneeId: personIds["Priya Patel"], priority: "high", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) },
      { meetingId: m1.id, text: "Scope integrations marketplace v1 (Slack, Linear, Jira)", assignee: "Mike Rodriguez", assigneeId: personIds["Mike Rodriguez"], priority: "high" },
      { meetingId: m1.id, text: "Draft AI summary prototype spec", assignee: "Alex Turner", assigneeId: personIds["Alex Turner"], priority: "medium" },
      { meetingId: m1.id, text: "Assign James to Slack + Linear integrations", assignee: "Mike Rodriguez", assigneeId: personIds["Mike Rodriguez"], priority: "medium" },
      { meetingId: m1.id, text: "Fast-track Thursday frontend candidate", assignee: "David Kim", assigneeId: personIds["David Kim"], priority: "high" },
      { meetingId: m1.id, text: "Model per-user LLM token cost for AI summary", assignee: "Mike Rodriguez", assigneeId: personIds["Mike Rodriguez"], priority: "medium", completed: true, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12) },
    ],
  });

  await db.comment.create({
    data: {
      meetingId: m1.id,
      userId: me.id,
      text: "This is a key decision — let's make sure the canvas design is reviewed before the next sprint.",
      type: "highlight",
      startTime: 114,
      endTime: 142,
    },
  });

  // ----------------------------------------------------------
  // Meeting 2 — Engineering Sprint Review & Retro
  // ----------------------------------------------------------
  const m2 = await db.meeting.create({
    data: {
      title: "Sprint 47 Review & Retrospective",
      date: new Date(Date.now() - 1000 * 60 * 60 * 72),
      durationSec: 2100,
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Internal Call",
      participants: {
        create: [
          { personId: personIds["Mike Rodriguez"], role: "host" },
          { personId: personIds["James Park"] },
          { personId: personIds["Liam Bennett"] },
          { personId: personIds["Sarah Chen"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Engineering"] }, { tagId: tagIds["Retro"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m2.id, personIds, [
      ["Mike Rodriguez", 3, 16, "Thanks team. Let's walk through Sprint 47 — what we shipped, what slipped, and then a short retro."],
      ["James Park", 18, 34, "On the backend, I finished the webhook retry logic. We now retry three times with exponential backoff and a dead letter queue for failures."],
      ["Mike Rodriguez", 36, 48, "Nice. Did you add the observability dashboard for it?"],
      ["James Park", 50, 66, "Not yet — I have the metrics exported but the Grafana panel is still TODO. Should be done by Wednesday."],
      ["Liam Bennett", 68, 84, "Frontend side, I shipped the new project list with virtualization. We can now render ten thousand projects without a hiccup."],
      ["Sarah Chen", 86, 100, "That's huge for our enterprise customers. Globex alone has six thousand projects."],
      ["Liam Bennett", 102, 118, "Yeah, and I caught a memory leak in the old list while I was at it. Patched in the same PR."],
      ["Mike Rodriguez", 120, 134, "What slipped this sprint?"],
      ["James Park", 136, 152, "The billing migration. The proration edge cases were nastier than expected, especially for mid-cycle plan upgrades. I pushed it to Sprint 48."],
      ["Mike Rodriguez", 154, 168, "Understandable. Let's pair on the edge cases Monday so we don't lose another sprint to it."],
      ["Liam Bennett", 170, 184, "One thing for retro — our CI is flaky again. The e2e suite fails randomly about fifteen percent of runs and it's killing confidence in green builds."],
      ["James Park", 186, 200, "I agree. I think it's the shared test database. Multiple suites hit it concurrently and we get dirty state."],
      ["Mike Rodriguez", 202, 216, "Good call. Action item — James, can you spike a per-suite database fixture this week?"],
      ["James Park", 218, 228, "Yep, I'll have a proposal by Thursday."],
      ["Liam Bennett", 230, 244, "Second retro item — the design handoffs have been late two sprints in a row. It blocks frontend starts."],
      ["Sarah Chen", 246, 260, "That's fair. I'll work with Priya to move design reviews earlier in the sprint so handoffs land by Wednesday."],
      ["Mike Rodriguez", 262, 276, "Last item — on call. Last week's page was at 2am for the webhook queue backing up. We need autoscaling on the consumer."],
      ["James Park", 278, 292, "I'll add a CPU based autoscale policy. Should be a half day of work."],
      ["Mike Rodriguez", 294, 308, "Great. Solid sprint overall, forty one points shipped, three points slipped. Let's keep the momentum."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m2.id,
      overview:
        "Sprint 47 delivered 41 story points including webhook retry logic with dead-letter queue and a virtualized project list that scales to 10k+ projects. The billing migration slipped to Sprint 48 due to proration edge cases. Retro surfaced two systemic issues: flaky e2e CI (15% random failures) caused by a shared test database, and late design handoffs blocking frontend starts. A 2am page on webhook queue backup flagged the need for consumer autoscaling.",
      keyPoints: JSON.stringify([
        "Webhook retry + DLQ shipped; observability dashboard still TODO (Wed).",
        "Virtualized project list handles 10k+ projects; fixed a memory leak in the old list.",
        "Billing migration slipped — proration edge cases need pairing on Monday.",
        "CI flaky at ~15% — root cause is shared test database; James to spike per-suite fixtures.",
        "Design handoffs late 2 sprints — Sarah to move reviews earlier.",
        "2am webhook queue page — autoscale policy needed.",
      ]),
      decisions: JSON.stringify([
        "Push billing migration to Sprint 48; pair on edge cases Monday.",
        "Spike per-suite database fixtures for CI this week.",
        "Move design reviews earlier so handoffs land by Wednesday.",
        "Add CPU-based autoscale for webhook consumer.",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m2.id, name: "Sprint Walkthrough", startTime: 3, endTime: 118, summary: "Webhook retry + virtualized project list shipped." },
      { meetingId: m2.id, name: "What Slipped", startTime: 120, endTime: 168, summary: "Billing migration deferred to Sprint 48 (proration edge cases)." },
      { meetingId: m2.id, name: "Retro — CI Flakiness", startTime: 170, endTime: 228, summary: "e2e suite fails ~15%; shared test DB is the cause." },
      { meetingId: m2.id, name: "Retro — Design Handoffs", startTime: 230, endTime: 260, summary: "Late handoffs blocking frontend starts; move reviews earlier." },
      { meetingId: m2.id, name: "On-Call & Close", startTime: 262, endTime: 308, summary: "2am webhook queue page — autoscale policy to be added." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m2.id, text: "Add Grafana observability dashboard for webhook retries", assignee: "James Park", assigneeId: personIds["James Park"], priority: "medium", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { meetingId: m2.id, text: "Pair on billing proration edge cases Monday", assignee: "James Park", assigneeId: personIds["James Park"], priority: "high" },
      { meetingId: m2.id, text: "Spike per-suite database fixtures for CI", assignee: "James Park", assigneeId: personIds["James Park"], priority: "high", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4) },
      { meetingId: m2.id, text: "Move design reviews earlier in the sprint", assignee: "Sarah Chen", assigneeId: personIds["Sarah Chen"], priority: "medium" },
      { meetingId: m2.id, text: "Add CPU-based autoscale policy for webhook consumer", assignee: "James Park", assigneeId: personIds["James Park"], priority: "high", completed: true, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 20) },
    ],
  });

  // ----------------------------------------------------------
  // Meeting 3 — Enterprise Sales Discovery Call (NorthStar)
  // ----------------------------------------------------------
  const m3 = await db.meeting.create({
    data: {
      title: "Discovery Call — NorthStar Logistics",
      date: new Date(Date.now() - 1000 * 60 * 60 * 48),
      durationSec: 2340,
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Sales Call",
      participants: {
        create: [
          { personId: personIds["Jenna Brooks"], role: "host" },
          { personId: personIds["Ryan Mitchell"] },
          { personId: personIds["Olivia Foster"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Sales"] }, { tagId: tagIds["Customer"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m3.id, personIds, [
      ["Jenna Brooks", 4, 18, "Hi Ryan, hi Olivia — thanks for making time. I want to understand NorthStar's operations workflow and where we might help."],
      ["Ryan Mitchell", 20, 38, "Happy to. We run about two hundred distribution centers across North America. Coordination between centers is... chaotic. Lots of phone calls, spreadsheets, lost context."],
      ["Olivia Foster", 40, 56, "To add to that — every center manager runs their operation differently. We have no shared playbook, no consistent handoffs between shifts."],
      ["Jenna Brooks", 58, 72, "That's exactly the kind of mess we love to help with. What does a typical handoff look like today?"],
      ["Ryan Mitchell", 74, 92, "End of shift, the outgoing manager writes a wall of text in a shared doc and pings the next shift on Slack. Half the time it's missed. Mistakes compound."],
      ["Jenna Brooks", 94, 108, "And how are you tracking incidents and recurring issues today?"],
      ["Olivia Foster", 110, 128, "We have a ticketing system but nobody uses it consistently. The frontline folks just want to talk — they don't want to file forms."],
      ["Jenna Brooks", 130, 146, "Interesting. Our meeting assistant captures those conversations automatically and turns them into structured notes and action items. No extra forms."],
      ["Ryan Mitchell", 148, 164, "That's appealing. The less we ask people to do, the better adoption we get."],
      ["Jenna Brooks", 166, 182, "Exactly. Walk me through your decision process — who else needs to be involved?"],
      ["Ryan Mitchell", 184, 202, "I'm the technical buyer, Olivia owns ops. Our CFO will want to see ROI — specifically, fewer incidents and lower overtime costs from miscommunication."],
      ["Olivia Foster", 204, 220, "If we can show even a ten percent reduction in shift handoff incidents, that pays for itself in a quarter."],
      ["Jenna Brooks", 222, 240, "That's a great benchmark. We can run a thirty day pilot at three of your highest-incident centers and measure exactly that."],
      ["Ryan Mitchell", 242, 258, "I like that. Concrete, time-boxed, measurable. What's the ramp look like?"],
      ["Jenna Brooks", 260, 278, "Onboarding is about a week. We connect your calendar, invite the bot to shift handoff calls, and start surfacing action items within forty eight hours of go live."],
      ["Olivia Foster", 280, 294, "Who typically owns rollout on the customer side?"],
      ["Jenna Brooks", 296, 312, "Usually an operations PM — we'd want someone who can champion adoption center by center. Ryan, would you sponsor internally?"],
      ["Ryan Mitchell", 314, 330, "Yes. I'll sponsor, Olivia's team drives rollout. Let's get a proposal by end of next week and aim to kick off the pilot on the first of the month."],
      ["Jenna Brooks", 332, 348, "Perfect. I'll send a proposal with the three center pilot scope, pricing, and an MSA template by Friday. Can we schedule the kickoff for the twenty eighth?"],
      ["Olivia Foster", 350, 366, "Works on our end. Looking forward to seeing this actually reduce the chaos."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m3.id,
      overview:
        "NorthStar Logistics runs ~200 distribution centers across North America with chaotic, inconsistent shift handoffs (shared docs + Slack, frequently missed). The frontline resists form-based ticketing. The buyer sees strong fit with an automatic meeting assistant that captures conversations and generates structured notes. Decision process: Ryan (CTO, technical buyer) + Olivia (VP Ops, owner) + CFO (ROI). Success metric: a 10% reduction in shift handoff incidents would self-fund within a quarter. Agreed path: 30-day pilot at 3 high-incident centers, proposal by Friday, kickoff on the 28th.",
      keyPoints: JSON.stringify([
        "200 distribution centers; handoffs via docs+Slack, half missed.",
        "Frontline won't use ticketing — prefers conversation.",
        "Buying committee: Ryan (CTO), Olivia (VP Ops), CFO (ROI).",
        "Success metric: 10% drop in shift handoff incidents pays for itself in a quarter.",
        "Pilot: 30 days, 3 high-incident centers, measurable from day 1.",
        "Onboarding ~1 week; calendar connect + bot invited to handoff calls.",
      ]),
      decisions: JSON.stringify([
        "Run a 30-day pilot at 3 centers with measurable incident reduction.",
        "Proposal + MSA to be sent by Friday.",
        "Pilot kickoff targeted for the 28th.",
        "Ryan sponsors internally; Olivia's team drives rollout.",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m3.id, name: "Current Workflow & Pain Points", startTime: 4, endTime: 92, summary: "200 DCs; handoffs via docs+Slack; half missed; inconsistent playbooks." },
      { meetingId: m3.id, name: "Incident Tracking Gap", startTime: 94, endTime: 128, summary: "Ticketing underused; frontline prefers conversation over forms." },
      { meetingId: m3.id, name: "Fit & Decision Process", startTime: 130, endTime: 220, summary: "Buyer committee: CTO + VP Ops + CFO; ROI = fewer incidents + lower overtime." },
      { meetingId: m3.id, name: "Pilot Design", startTime: 222, endTime: 312, summary: "30-day, 3 high-incident centers; 1-week onboarding; ~48h to first action items." },
      { meetingId: m3.id, name: "Next Steps", startTime: 314, endTime: 366, summary: "Proposal by Friday; kickoff on the 28th; Ryan sponsors, Olivia drives rollout." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m3.id, text: "Send pilot proposal + MSA template by Friday", assignee: "Jenna Brooks", assigneeId: personIds["Jenna Brooks"], priority: "high", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) },
      { meetingId: m3.id, text: "Schedule pilot kickoff for the 28th", assignee: "Jenna Brooks", assigneeId: personIds["Jenna Brooks"], priority: "high" },
      { meetingId: m3.id, text: "Sponsor rollout internally at NorthStar", assignee: "Ryan Mitchell", assigneeId: personIds["Ryan Mitchell"], priority: "high" },
      { meetingId: m3.id, text: "Identify 3 highest-incident centers for pilot", assignee: "Olivia Foster", assigneeId: personIds["Olivia Foster"], priority: "medium" },
      { meetingId: m3.id, text: "Prepare ROI benchmark (10% incident reduction)", assignee: "Jenna Brooks", assigneeId: personIds["Jenna Brooks"], priority: "medium", completed: true, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 6) },
    ],
  });

  // ----------------------------------------------------------
  // Meeting 4 — Customer Onboarding Check-in (Globex)
  // ----------------------------------------------------------
  const m4 = await db.meeting.create({
    data: {
      title: "Onboarding Check-in — Globex",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      durationSec: 1620,
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Customer Call",
      participants: {
        create: [
          { personId: personIds["Tom Walsh"], role: "host" },
          { personId: personIds["Nina Kapoor"] },
          { personId: personIds["Marcus Webb"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Customer"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m4.id, personIds, [
      ["Tom Walsh", 2, 14, "Nina, Marcus — good to see you. Two weeks into onboarding now, wanted to check in on how it's going."],
      ["Nina Kapoor", 16, 32, "Overall, really well. We've got about sixty percent of ops managers inviting the bot to their standups. Adoption is ahead of where we expected."],
      ["Marcus Webb", 34, 50, "From a finance angle — the auto-generated meeting summaries save my team roughly four hours a week of manual recap work. That's measurable."],
      ["Tom Walsh", 52, 64, "That's fantastic. What's not working yet?"],
      ["Nina Kapoor", 66, 82, "Two things. First, the search across meetings is great but we can't filter by region — and for a global org that matters."],
      ["Tom Walsh", 84, 96, "Got it. Region filter — I'll log that as a feature request. What's the second?"],
      ["Marcus Webb", 98, 116, "Second — the action items don't sync to our Jira. Right now ops managers copy them over manually, which kills the whole point."],
      ["Tom Walsh", 118, 132, "Totally fair. We actually have a Jira integration in private beta. I can get you on it this week if you're willing to test early."],
      ["Nina Kapoor", 134, 146, "Absolutely. Marcus's team would be the heavy users — that's a great fit."],
      ["Tom Walsh", 148, 162, "Perfect. I'll loop in our integrations PM and we'll have you set up by next Tuesday."],
      ["Marcus Webb", 164, 178, "One more thing — we'd love topic-based chapters for longer all hands meetings. Right now the summary is one block; chapters would help navigation."],
      ["Tom Walsh", 180, 194, "Good news — chapters are shipping in our next release, end of this month. You'll see them automatically."],
      ["Nina Kapoor", 196, 210, "Excellent. Anything you need from us to keep momentum?"],
      ["Tom Walsh", 212, 228, "Yes — if you can nominate three power users to give us candid feedback in a thirty minute call next month, that's gold for us."],
      ["Marcus Webb", 230, 244, "Done. I'll send you three names by end of week. Two from ops, one from finance."],
      ["Tom Walsh", 246, 260, "Appreciate it. Anything else before we wrap?"],
      ["Nina Kapoor", 262, 270, "Nope, all good. Thanks for staying close, Tom."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m4.id,
      overview:
        "Two weeks into Globex's onboarding, adoption is ahead of plan — ~60% of ops managers invite the bot to standups, and finance saves ~4 hours/week on manual recaps. Two pain points surfaced: (1) no region filter in cross-meeting search (matters for a global org) and (2) action items don't sync to Jira, forcing manual copy. Jira integration is in private beta and will be enabled for Globex this week. Chapters/topical navigation ships end of month. Globex will nominate 3 power users for a feedback call next month.",
      keyPoints: JSON.stringify([
        "60% ops manager adoption in 2 weeks — ahead of plan.",
        "Finance team saves ~4 hrs/week on recaps.",
        "Pain: no region filter in global search — logged as feature request.",
        "Pain: no Jira sync for action items — manual copy today.",
        "Jira private beta — Globex onboarded this week (by Tuesday).",
        "Chapters feature ships end of month.",
        "Globex to nominate 3 power users for feedback call.",
      ]),
      decisions: JSON.stringify([
        "Enable Jira private beta for Globex by next Tuesday.",
        "Log region filter as a feature request.",
        "Globex nominates 3 power users (2 ops, 1 finance) for feedback call.",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m4.id, name: "Adoption Wins", startTime: 2, endTime: 50, summary: "60% ops adoption; finance saves 4 hrs/week on recaps." },
      { meetingId: m4.id, name: "Pain Points", startTime: 52, endTime: 116, summary: "No region filter; no Jira sync for action items." },
      { meetingId: m4.id, name: "Solutions & Roadmap", startTime: 118, endTime: 194, summary: "Jira private beta enabled this week; chapters ship end of month." },
      { meetingId: m4.id, name: "Feedback & Wrap", startTime: 196, endTime: 270, summary: "Globex to nominate 3 power users for feedback call." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m4.id, text: "Log region filter as feature request", assignee: "Tom Walsh", assigneeId: personIds["Tom Walsh"], priority: "medium" },
      { meetingId: m4.id, text: "Enable Jira private beta for Globex by Tuesday", assignee: "Tom Walsh", assigneeId: personIds["Tom Walsh"], priority: "high", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { meetingId: m4.id, text: "Loop in integrations PM for Globex Jira setup", assignee: "Tom Walsh", assigneeId: personIds["Tom Walsh"], priority: "medium", completed: true, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 30) },
      { meetingId: m4.id, text: "Send 3 power user names (2 ops, 1 finance)", assignee: "Marcus Webb", assigneeId: personIds["Marcus Webb"], priority: "medium", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) },
    ],
  });

  // ----------------------------------------------------------
  // Meeting 5 — Design Critique: Mobile App Redesign
  // ----------------------------------------------------------
  const m5 = await db.meeting.create({
    data: {
      title: "Design Critique — Mobile App Redesign",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      durationSec: 1860,
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Internal Call",
      participants: {
        create: [
          { personId: personIds["Priya Patel"], role: "host" },
          { personId: personIds["Emma Liu"] },
          { personId: personIds["Sarah Chen"] },
          { personId: personIds["Liam Bennett"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Design"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m5.id, personIds, [
      ["Priya Patel", 3, 16, "Thanks everyone. Today we're critiquing Emma's mobile app redesign — focusing on the new home screen and the project creation flow."],
      ["Emma Liu", 18, 36, "Great. I pushed the v3 prototype to Figma yesterday. The big change from v2 is moving the search bar to the top and surfacing recent projects as cards instead of a list."],
      ["Sarah Chen", 38, 54, "I love the recent project cards. They give the home screen real content immediately instead of an empty state."],
      ["Emma Liu", 56, 72, "Thanks. The empty state still exists for first time users — it has a guided create flow, but I want to revisit that."],
      ["Liam Bennett", 74, 90, "From an engineering angle — the cards are easy to render, but the swipe to archive gesture you prototyped is going to need a custom pan responder on React Native."],
      ["Emma Liu", 92, 106, "Is that a lot of work?"],
      ["Liam Bennett", 108, 122, "Not huge, maybe two days. But we should decide if swipe archive is worth it versus a long press menu."],
      ["Priya Patel", 124, 138, "Good question. I'd defer to research — Sarah, do we have data on which gesture users discover faster?"],
      ["Sarah Chen", 140, 156, "We don't have it for mobile yet. But on web, the long press menu had three times the discovery rate of swipe gestures."],
      ["Emma Liu", 158, 172, "Okay, let's go with long press then. I'll update the prototype this afternoon."],
      ["Priya Patel", 174, 188, "Next — the project creation flow. Emma, walk us through it."],
      ["Emma Liu", 190, 208, "It's three steps now — pick a template, name and team, then invite. The big change is step one shows templates as a horizontal carousel instead of a list."],
      ["Sarah Chen", 210, 226, "I'm worried the carousel hides options. Users on small screens only see two at a time. Have you considered a grid?"],
      ["Emma Liu", 228, 244, "I tested both — grid had higher template selection completion in usability tests, sixty eight percent versus fifty four."],
      ["Priya Patel", 246, 260, "That settles it. Grid. Emma, ship it."],
      ["Liam Bennett", 262, 278, "One more thing — the invite step has a Slack connect button that triggers an OAuth flow. The redirect on mobile is a little janky right now."],
      ["Emma Liu", 280, 294, "I'll work with you on a native deep link approach. Let's sync Thursday."],
      ["Priya Patel", 296, 310, "Great session. Let's regroup next week with the updated prototype and we'll do a final review before engineering starts the build."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m5.id,
      overview:
        "Critique of Emma's v3 mobile redesign. Home screen changes (search at top, recent projects as cards) were well received. Decision: use long-press archive menu over swipe gesture — web data showed 3x higher discovery for long-press. Project creation flow: template carousel replaced with a grid after usability testing showed 68% vs 54% template-selection completion. Open item: native deep-link for the Slack OAuth redirect on mobile (Emma + Liam sync Thursday).",
      keyPoints: JSON.stringify([
        "Home: search at top, recent project cards — approved.",
        "Decision: long-press archive menu over swipe (3x discovery on web).",
        "Decision: template grid over carousel (68% vs 54% completion).",
        "Open: native deep link for Slack OAuth on mobile.",
        "Emma + Liam sync Thursday on the deep link approach.",
        "Final review next week before engineering build starts.",
      ]),
      decisions: JSON.stringify([
        "Use long-press menu instead of swipe-to-archive.",
        "Replace template carousel with a grid.",
        "Sync Thursday on native deep link for Slack OAuth.",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m5.id, name: "Home Screen Critique", startTime: 3, endTime: 122, summary: "Recent project cards approved; long-press chosen over swipe (3x discovery)." },
      { meetingId: m5.id, name: "Project Creation Flow", startTime: 174, endTime: 260, summary: "Template grid over carousel (68% vs 54% completion in tests)." },
      { meetingId: m5.id, name: "Slack OAuth & Next Steps", startTime: 262, endTime: 310, summary: "Native deep link needed for mobile OAuth; Emma + Liam sync Thursday; final review next week." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m5.id, text: "Update prototype: long-press archive instead of swipe", assignee: "Emma Liu", assigneeId: personIds["Emma Liu"], priority: "high", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1) },
      { meetingId: m5.id, text: "Swap template carousel for grid", assignee: "Emma Liu", assigneeId: personIds["Emma Liu"], priority: "high", completed: true, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
      { meetingId: m5.id, text: "Sync with Liam on native deep link for Slack OAuth", assignee: "Emma Liu", assigneeId: personIds["Emma Liu"], priority: "medium", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { meetingId: m5.id, text: "Schedule final prototype review next week", assignee: "Priya Patel", assigneeId: personIds["Priya Patel"], priority: "medium" },
    ],
  });

  // ----------------------------------------------------------
  // Meeting 6 — Weekly All-Hands
  // ----------------------------------------------------------
  const m6 = await db.meeting.create({
    data: {
      title: "Weekly All-Hands — Company Update",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      durationSec: 1980,
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Internal Call",
      participants: {
        create: [
          { personId: personIds["David Kim"], role: "host" },
          { personId: personIds["Sarah Chen"] },
          { personId: personIds["Jenna Brooks"] },
          { personId: personIds["Sophia Reyes"] },
          { personId: personIds["Tom Walsh"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Quarterly"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m6.id, personIds, [
      ["David Kim", 2, 16, "Good morning everyone. Quick all hands today — three updates: product, growth, and customer. Then Q and A."],
      ["David Kim", 18, 30, "First, product. Sarah, want to kick us off?"],
      ["Sarah Chen", 32, 48, "Sure. Big news — onboarding revamp is officially our Q3 number one bet. We're moving from a wizard to a canvas flow."],
      ["Sarah Chen", 50, 66, "Integrations marketplace is bet two. We'll ship Slack, Linear, and Jira by end of Q3. This should meaningfully move retention."],
      ["David Kim", 68, 80, "Growth — Sophia, how's the funnel looking?"],
      ["Sophia Reyes", 82, 100, "Top of funnel is up twenty two percent month over month — the SEO investment is paying off. But mid-funnel still leaks at the demo stage."],
      ["Sophia Reyes", 102, 118, "I'm working with Jenna on a demo retargeting sequence. Early results show a fifteen percent lift in demo to trial conversion."],
      ["David Kim", 120, 132, "Nice. Sales — Jenna?"],
      ["Jenna Brooks", 134, 152, "Pipeline is healthy. We have a strong enterprise pipeline — NorthStar Logistics is closing in on a pilot, decision expected by month end."],
      ["Jenna Brooks", 154, 170, "If NorthStar closes, that's our largest deal this year and a great reference for logistics."],
      ["David Kim", 172, 184, "Customer — Tom, how's the churn fight going?"],
      ["Tom Walsh", 186, 204, "Net revenue retention ticked up to one hundred and eight percent. Globex is the big win — their finance team saved four hours a week."],
      ["Tom Walsh", 206, 222, "Big focus this quarter — Jira integration GA and region filtering. Both directly requested by Globex and NorthStar."],
      ["David Kim", 224, 238, "Excellent. Reminder — company offsite is in six weeks. Sophia is coordinating logistics, please fill out the RSVP form by Friday."],
      ["David Kim", 240, 254, "Open Q and A. Go ahead, James."],
      ["James Park", 256, 272, "Question — is the AI summary prototype still on for Q3? I heard it might be deprioritized."],
      ["Sarah Chen", 274, 290, "Great question. It's still on but as bet three — meaning we prototype internally first and decide on external rollout based on quality and cost."],
      ["David Kim", 292, 306, "Anything else? No? Thanks everyone, great momentum. Let's keep it up."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m6.id,
      overview:
        "Weekly all-hands covering product, growth, sales, and customer. Product confirmed onboarding revamp (canvas flow) as Q3 bet #1 and integrations marketplace (Slack, Linear, Jira) as bet #2. Growth: top-of-funnel up 22% MoM from SEO; demo retargeting sequence showing 15% lift in demo→trial. Sales: healthy enterprise pipeline, NorthStar Logistics pilot expected to close by month-end (would be largest deal of the year). Customer: NRR up to 108%, Globex finance team saves 4 hrs/week. AI summary prototype still bet #3 — internal prototype first. Company offsite in 6 weeks, RSVP by Friday.",
      keyPoints: JSON.stringify([
        "Onboarding revamp (canvas) = Q3 bet #1; integrations marketplace = bet #2.",
        "Top-of-funnel +22% MoM (SEO); demo retargeting +15% demo→trial.",
        "NorthStar Logistics pilot expected to close by month-end (largest deal of year).",
        "NRR up to 108%; Globex saves 4 hrs/week on recaps.",
        "AI summary prototype is bet #3 — internal first, then decide on external rollout.",
        "Company offsite in 6 weeks — RSVP by Friday.",
      ]),
      decisions: JSON.stringify([
        "Q3 bets confirmed: onboarding revamp, integrations marketplace, AI summary prototype (internal).",
        "RSVP for company offsite due Friday.",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m6.id, name: "Opening", startTime: 2, endTime: 30, summary: "Three updates: product, growth, customer + Q&A." },
      { meetingId: m6.id, name: "Product Update", startTime: 32, endTime: 66, summary: "Q3 bets: onboarding canvas (bet #1) + integrations marketplace (bet #2)." },
      { meetingId: m6.id, name: "Growth Update", startTime: 82, endTime: 118, summary: "Top-of-funnel +22% MoM; demo retargeting +15%." },
      { meetingId: m6.id, name: "Sales & Customer", startTime: 134, endTime: 222, summary: "NorthStar pilot imminent; NRR 108%; Globex saves 4 hrs/wk." },
      { meetingId: m6.id, name: "Q&A & Wrap", startTime: 240, endTime: 306, summary: "AI summary prototype = bet #3 (internal first); offsite in 6 weeks." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m6.id, text: "RSVP for company offsite by Friday", assignee: "David Kim", assigneeId: personIds["David Kim"], priority: "medium", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { meetingId: m6.id, text: "Close NorthStar pilot by month-end", assignee: "Jenna Brooks", assigneeId: personIds["Jenna Brooks"], priority: "high" },
      { meetingId: m6.id, text: "Ship Jira integration GA this quarter", assignee: "Tom Walsh", assigneeId: personIds["Tom Walsh"], priority: "high" },
      { meetingId: m6.id, text: "Roll out demo retargeting sequence", assignee: "Sophia Reyes", assigneeId: personIds["Sophia Reyes"], priority: "medium", completed: true, completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    ],
  });

  // ----------------------------------------------------------
  // Meeting 7 — Candidate Interview: Senior Frontend Engineer
  // ----------------------------------------------------------
  const m7 = await db.meeting.create({
    data: {
      title: "Interview — Senior Frontend Engineer Candidate",
      date: new Date(Date.now() - 1000 * 60 * 60 * 8),
      durationSec: 2400,
      organizerId: me.id,
      source: "bot",
      status: "completed",
      meetingType: "Interview",
      participants: {
        create: [
          { personId: personIds["Mike Rodriguez"], role: "host" },
          { personId: personIds["Liam Bennett"] },
          { personId: personIds["Sarah Chen"] },
        ],
      },
      tags: { create: [{ tagId: tagIds["Interview"] }, { tagId: tagIds["Engineering"] }] },
    },
  });

  await db.transcriptSegment.createMany({
    data: buildSegs(m7.id, personIds, [
      ["Mike Rodriguez", 4, 18, "Welcome — thanks for coming in. We'll do a mix of background, system design, and a quick coding discussion. Maybe thirty seconds on your background?"],
      ["Sarah Chen", 20, 36, "Sure. Six years in frontend — last three at a Series B SaaS doing React, TypeScript, and a bunch of accessibility work."],
      ["Liam Bennett", 38, 52, "Great. Let's talk about a hard problem you owned. Pick something you're proud of."],
      ["Sarah Chen", 54, 74, "I rebuilt our data grid — the old one rendered ten thousand rows at once and froze the browser. I introduced virtualization and dropped initial render from four seconds to two hundred milliseconds."],
      ["Liam Bennett", 76, 88, "That's the exact problem we just solved. What library did you use?"],
      ["Sarah Chen", 90, 106, "react-window for the core, but I had to extend it for variable row heights. That was the trickiest part — measuring offscreen rows without layout thrash."],
      ["Mike Rodriguez", 108, 124, "Nice. Let's pivot to system design. Imagine you're building a real time collaborative document editor — how would you approach conflict resolution?"],
      ["Sarah Chen", 126, 144, "I'd start with the data model — operations as a CRDT or OT. For a doc editor I lean toward Yjs since it handles offline and merges cleanly."],
      ["Sarah Chen", 146, 162, "Network layer — websocket for live, with a fallback to long polling. Presence is a separate channel so it doesn't block document sync."],
      ["Mike Rodriguez", 164, 180, "How would you handle a user going offline for ten minutes and coming back with conflicts?"],
      ["Sarah Chen", 182, 200, "CRDTs handle that natively — the local state keeps applying ops and on reconnect we sync the difference. The UI just shows the merged result. No conflict resolution prompts needed."],
      ["Liam Bennett", 202, 216, "Good answer. Quick coding question — implement a debounce function and explain when you'd use it over throttle."],
      ["Sarah Chen", 218, 236, "Debounce fires after a quiet period — search boxes, autosave. Throttle fires at most every N ms — scroll, resize. I'd use debounce when I only care about the final value."],
      ["Mike Rodriguez", 238, 252, "Solid. Last question — how do you keep up with frontend? It moves fast."],
      ["Sarah Chen", 254, 270, "I follow a handful of folks on Bluesky, read the React RFCs, and try to contribute to one open source repo a quarter. Keeps me honest."],
      ["Mike Rodriguez", 272, 286, "Love it. That's all from us — any questions for us?" ],
      ["Sarah Chen", 288, 304, "Yeah — what's the biggest technical challenge your team is facing right now?"],
      ["Liam Bennett", 306, 322, "Honestly, it's the Jira integration we're scoping. Handling their webhook retries idempotently is harder than it sounds."],
      ["Sarah Chen", 324, 338, "Interesting — I dealt with idempotency keys on a payments integration last year. Happy to dig into that."],
      ["Mike Rodriguez", 340, 354, "We'll be in touch by end of week. Thanks for coming in."],
    ]),
  });

  await db.summary.create({
    data: {
      meetingId: m7.id,
      overview:
        "Senior frontend candidate (6 yrs experience, last 3 at Series B SaaS). Strong signal on the virtualized data grid problem — independently solved the same problem we just fixed (react-window, variable row heights). System design: solid CRDT/Yjs answer for collaborative editing, including offline-then-reconnect. Clear grasp of debounce vs throttle with correct use-cases. Asked a good question about our team's hardest problem (Jira idempotency) and had relevant payments-integration experience. Recommendation: advance to final round.",
      keyPoints: JSON.stringify([
        "6 yrs frontend; React/TS/accessibility focus.",
        "Independently solved virtualized grid (react-window + variable heights) — same as our recent fix.",
        "CRDT/Yjs answer for collaborative editing; handled offline reconnect correctly.",
        "Correct debounce vs throttle distinction with real use-cases.",
        "Asked about our hardest problem (Jira idempotency) — has relevant payments idempotency experience.",
        "Recommendation: advance to final round.",
      ]),
      decisions: JSON.stringify([
        "Advance candidate to final round (pending debrief).",
      ]),
    },
  });

  await db.topic.createMany({
    data: [
      { meetingId: m7.id, name: "Background", startTime: 4, endTime: 36, summary: "6 yrs frontend; Series B SaaS last 3 years; React/TS/a11y focus." },
      { meetingId: m7.id, name: "Hard Problem — Data Grid", startTime: 38, endTime: 106, summary: "Rebuilt data grid with virtualization; render 4s → 200ms." },
      { meetingId: m7.id, name: "System Design — Collab Editor", startTime: 108, endTime: 200, summary: "Yjs CRDT + websocket; offline reconnect handled natively." },
      { meetingId: m7.id, name: "Coding & Wrap", startTime: 202, endTime: 354, summary: "Solid debounce/throttle answer; candidate asked about Jira idempotency; advance to final round." },
    ],
  });

  await db.actionItem.createMany({
    data: [
      { meetingId: m7.id, text: "Debrief candidate with hiring panel", assignee: "Mike Rodriguez", assigneeId: personIds["Mike Rodriguez"], priority: "high", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { meetingId: m7.id, text: "Schedule final round if debrief is positive", assignee: "Mike Rodriguez", assigneeId: personIds["Mike Rodriguez"], priority: "high" },
      { meetingId: m7.id, text: "Reference check — previous employer", assignee: "Liam Bennett", assigneeId: personIds["Liam Bennett"], priority: "medium" },
    ],
  });

  console.log(`✅ Seeded ${7} meetings with full transcripts, summaries, action items, and topics.`);
  console.log(`✅ Default user: ${me.email}`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
