"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Sparkles, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";

const MEETING_TYPES = [
  "Internal Call",
  "Sales Call",
  "Customer Call",
  "Standup",
  "Interview",
  "All Hands",
  "Workshop",
];

type SamplePreset = {
  id: string;
  title: string;
  meetingType: string;
  participants: string;
  text: string;
};

const SAMPLES: SamplePreset[] = [
  {
    id: "standup",
    title: "Daily Standup",
    meetingType: "Standup",
    participants: "Alice, Bob, Charlie",
    text: `Alice: Yesterday I finished the auth flow, today I'll work on the dashboard.
Bob: I'm blocked on the API key from infra, need it to test the upload.
Charlie: I'll pair with Bob on that. Also, the staging deploy is green.
Alice: Great. Action item — Alice to send Bob the API key by EOD.`,
  },
  {
    id: "sales",
    title: "Discovery Call — Acme Corp",
    meetingType: "Sales Call",
    participants: "Dana, Evan (Acme)",
    text: `Dana: Thanks for the time, Evan. What's pushing you to look at a meeting assistant now?
Evan: Our team spends hours writing recaps and we still miss action items.
Dana: That's exactly what we solve. How many calls a week?
Evan: Maybe forty, mostly customer interviews.
Dana: We can capture all of those. What's your timeline for a decision?
Evan: I'd like something in place by end of quarter.`,
  },
];

export function CreateMeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const openMeeting = useAppStore((s) => s.openMeeting);

  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [meetingType, setMeetingType] = useState(MEETING_TYPES[0]);
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [tab, setTab] = useState<"paste" | "sample">("paste");
  const [transcriptText, setTranscriptText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // reset on close
  useEffect(() => {
    if (!open) {
      setTitle("");
      setParticipants("");
      setMeetingType(MEETING_TYPES[0]);
      setDate(new Date().toISOString().slice(0, 16));
      setTranscriptText("");
      setTab("paste");
    }
  }, [open]);

  function loadSample(s: SamplePreset) {
    setTitle(s.title);
    setMeetingType(s.meetingType);
    setParticipants(s.participants);
    setTranscriptText(s.text);
    setTab("paste");
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Please give the meeting a title.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          meetingType,
          date: date ? new Date(date) : undefined,
          participants: participants
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          transcriptText: transcriptText.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create meeting");
      }
      const { id } = await res.json();
      await qc.invalidateQueries({ queryKey: ["meetings"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Meeting created");
      onOpenChange(false);
      openMeeting(id);
    } catch (e: any) {
      toast.error(e?.message || "Could not create meeting");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Create a meeting
          </DialogTitle>
          <DialogDescription>
            Upload or paste a transcript. We'll generate speakers, a media
            timeline, and you can run AI summary on it afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Planning Sync"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="type">Meeting type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="participants">
                Participants{" "}
                <span className="text-xs text-muted-foreground">
                  (comma separated)
                </span>
              </Label>
              <Input
                id="participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Alice, Bob, Carol"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date &amp; time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "paste" | "sample")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Paste transcript
              </TabsTrigger>
              <TabsTrigger value="sample" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Sample templates
              </TabsTrigger>
            </TabsList>

            {tab === "paste" ? (
              <div className="mt-3 grid gap-1.5">
                <Label htmlFor="transcript">Transcript</Label>
                <Textarea
                  id="transcript"
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder={`Paste a transcript. Supported formats:\n\nSarah: Welcome everyone.\nMike: Let's start with the roadmap.\n\n— or —\n\nWEBVTT\n00:00:02.000 --> 00:00:10.000\n<v Sarah>Welcome everyone.`}
                  className="min-h-[180px] font-mono text-xs scrollbar-thin"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lines like{" "}
                  <code className="rounded bg-muted px-1">
                    Speaker: text
                  </code>{" "}
                  are auto-split into timestamped segments. WebVTT is also
                  supported.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s)}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.meetingType} · {s.participants}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary">
                      Use →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Tabs>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={submitting || !title.trim()}
            className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
          >
            {submitting ? "Creating…" : "Create meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
