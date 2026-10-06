"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Highlighter, Loader2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/fireflies/user-avatar";
import { formatTimestamp } from "@/lib/fireflies/format";
import type { TranscriptSegment } from "@/lib/fireflies/types";

export function AddCommentDialog({
  target,
  meetingId,
  onClose,
}: {
  target: {
    seg: TranscriptSegment;
    type: "comment" | "highlight";
  } | null;
  meetingId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const open = !!target;

  useEffect(() => {
    setText("");
  }, [target]);

  if (!target) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const { seg, type } = target;

  async function handleSave() {
    if (!text.trim()) {
      toast.error("Please write something first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          type,
          segmentId: seg.id,
          startTime: seg.startTime,
          endTime: seg.endTime,
        }),
      });
      if (!res.ok) throw new Error("failed");
      await qc.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success(type === "highlight" ? "Highlight added" : "Comment added");
      onClose();
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "highlight" ? (
              <Highlighter className="h-4 w-4 text-primary" />
            ) : (
              <MessageSquare className="h-4 w-4 text-primary" />
            )}
            {type === "highlight" ? "Add highlight" : "Add comment"}
          </DialogTitle>
          <DialogDescription>
            {type === "highlight"
              ? "Save this moment as a soundbite you can share later."
              : "Leave a note on this transcript segment."}
          </DialogDescription>
        </DialogHeader>

        {/* The segment being annotated */}
        <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <UserAvatar
            name={seg.speaker.name}
            color={seg.speaker.avatarColor}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold">
              {seg.speaker.name}{" "}
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                {formatTimestamp(seg.startTime)}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {seg.text}
            </p>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            type === "highlight" ? "Note about this highlight…" : "Your comment…"
          }
          className="min-h-[100px] scrollbar-thin"
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
