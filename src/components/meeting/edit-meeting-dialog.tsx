"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MeetingDetail } from "@/lib/fireflies/types";

const MEETING_TYPES = [
  "Internal Call",
  "Sales Call",
  "Customer Call",
  "Standup",
  "Interview",
  "All Hands",
  "Workshop",
];

export function EditMeetingDialog({
  open,
  onOpenChange,
  meeting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting: MeetingDetail;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(meeting.title);
  const [participants, setParticipants] = useState(
    meeting.participants.map((p) => p.person.name).join(", "),
  );
  const [meetingType, setMeetingType] = useState(meeting.meetingType);
  const [date, setDate] = useState(
    new Date(meeting.date).toISOString().slice(0, 16),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(meeting.title);
      setParticipants(
        meeting.participants.map((p) => p.person.name).join(", "),
      );
      setMeetingType(meeting.meetingType);
      setDate(new Date(meeting.date).toISOString().slice(0, 16));
    }
  }, [open, meeting]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          meetingType,
          date: new Date(date),
          participants: participants
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("failed");
      await qc.invalidateQueries({ queryKey: ["meeting", meeting.id] });
      await qc.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting updated");
      onOpenChange(false);
    } catch {
      toast.error("Could not update meeting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>
            Update the meeting title, participants, type, or date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-participants">
              Participants{" "}
              <span className="text-xs text-muted-foreground">
                (comma separated)
              </span>
            </Label>
            <Input
              id="edit-participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger id="edit-type">
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
            <div className="grid gap-1.5">
              <Label htmlFor="edit-date">Date &amp; time</Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
