"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Loader2,
  FileText,
  ListChecks,
  Bookmark,
  Sparkles,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/fireflies/user-avatar";
import {
  formatDate,
  formatDuration,
  formatDateTime,
} from "@/lib/fireflies/format";
import { useAppStore } from "@/store/app-store";
import { usePlayback } from "@/components/meeting/use-playback";
import { MediaPlayer } from "@/components/meeting/media-player";
import { TranscriptView } from "@/components/meeting/transcript-view";
import { SummaryPanel } from "@/components/meeting/summary-panel";
import { ActionItemsPanel } from "@/components/meeting/action-items-panel";
import { TopicsPanel } from "@/components/meeting/topics-panel";
import { AskAI } from "@/components/meeting/ask-ai";
import { EditMeetingDialog } from "@/components/meeting/edit-meeting-dialog";
import { AddCommentDialog } from "@/components/meeting/add-comment-dialog";
import type {
  MeetingDetail as MeetingDetailType,
  TranscriptSegment,
} from "@/lib/fireflies/types";

export function MeetingDetail({ meetingId }: { meetingId: string }) {
  const qc = useQueryClient();
  const backToDashboard = useAppStore((s) => s.backToDashboard);
  const [tab, setTab] = useState("transcript");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{
    seg: TranscriptSegment;
    type: "comment" | "highlight";
  } | null>(null);
  const [seekFromSearch, setSeekFromSearch] = useState<number | null>(null);

  // read a desired seek time from global-search selection
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(`ff:seek:${meetingId}`);
      if (v !== null) {
        const n = Number(v);
        if (!Number.isNaN(n)) {
          setSeekFromSearch(n);
          setTab("transcript");
        }
        sessionStorage.removeItem(`ff:seek:${meetingId}`);
      }
    } catch {}
  }, [meetingId]);

  const { data, isLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.meeting as MeetingDetailType;
    },
    enabled: !!meetingId,
  });

  const playback = usePlayback(data?.durationSec ?? 0);

  // apply seek-from-search once we have data
  useEffect(() => {
    if (data && seekFromSearch !== null) {
      playback.seek(seekFromSearch);
      setSeekFromSearch(null);
    }
  }, [data]);

  const participants = useMemo(
    () =>
      (data?.participants ?? []).map((p) => p.person.name),
    [data],
  );

  async function handleExport(format: "txt" | "md" | "vtt") {
    if (!data) return;
    try {
      const res = await fetch(
        `/api/meetings/${meetingId}/export?format=${format}`,
      );
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(data.title)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/meetings/${meetingId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await qc.invalidateQueries({ queryKey: ["meetings"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Meeting deleted");
      backToDashboard();
    } else {
      toast.error("Delete failed");
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {data.meetingType}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {data.source}
            </Badge>
            {data.tags.map((t) => (
              <span
                key={t.tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${t.tag.color}1a`,
                  color: t.tag.color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: t.tag.color }}
                />
                {t.tag.name}
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            {data.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateTime(data.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(data.durationSec)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {data.participants.length} participants
            </span>
          </div>
          {/* Participant avatars */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {data.participants.map((p) => (
              <div
                key={p.person.id}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1"
              >
                <UserAvatar
                  name={p.person.name}
                  color={p.person.avatarColor}
                  size="sm"
                />
                <span className="text-xs font-medium">
                  {p.person.name}
                </span>
                {p.role === "host" && (
                  <span className="text-[10px] text-primary">· host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("txt")}>
                Plain text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("md")}>
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("vtt")}>
                WebVTT (.vtt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete meeting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body: media + tabs + ask AI */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: player + tabs */}
        <div className="space-y-4 lg:col-span-2">
          <MediaPlayer
            playback={playback}
            title={data.title}
            meetingType={data.meetingType}
          />

          <Tabs
            value={tab}
            onValueChange={setTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="transcript" className="gap-1 text-xs sm:text-sm">
                <AlignLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Transcript</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-1 text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1 text-xs sm:text-sm">
                <ListChecks className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="gap-1 text-xs sm:text-sm">
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Topics</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-4">
              {data.segments.length > 0 ? (
                <TranscriptView
                  segments={data.segments}
                  playback={playback}
                  onAddComment={(seg, type) =>
                    setCommentTarget({ seg, type })
                  }
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                  This meeting has no transcript yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <SummaryPanel
                meetingId={meetingId}
                summary={data.summary}
                hasTranscript={data.segments.length > 0}
              />
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <ActionItemsPanel
                meetingId={meetingId}
                items={data.actionItems}
                participants={participants}
              />
            </TabsContent>

            <TabsContent value="topics" className="mt-4">
              <TopicsPanel topics={data.topics} playback={playback} />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesPanel
                notes={data.notes}
                meetingId={meetingId}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Ask AI */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <AskAI meetingId={meetingId} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditMeetingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        meeting={data}
      />
      <AddCommentDialog
        target={commentTarget}
        meetingId={meetingId}
        onClose={() => setCommentTarget(null)}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{data.title}&quot; and all its
              transcript, summary, action items, and comments. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NotesPanel({
  notes,
  meetingId,
}: {
  notes: string | null;
  meetingId: string;
}) {
  const [value, setValue] = useState(notes || "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setValue(notes || "");
  }, [notes]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      if (!res.ok) throw new Error("failed");
      await qc.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success("Notes saved");
    } catch {
      toast.error("Could not save notes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Private notes</h3>
        <Button
          size="sm"
          onClick={save}
          disabled={saving || value === (notes || "")}
          className="gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jot down your own notes for this meeting…"
        className="min-h-[260px] resize-y scrollbar-thin"
      />
    </div>
  );
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
