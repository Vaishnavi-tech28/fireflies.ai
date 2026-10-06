"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  Loader2,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionItem } from "@/lib/fireflies/types";
import { cn } from "@/lib/utils";

const PRIORITIES = ["low", "medium", "high"] as const;

export function ActionItemsPanel({
  meetingId,
  items,
  participants,
}: {
  meetingId: string;
  items: ActionItem[];
  participants: string[];
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  const open = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  async function invalidate() {
    await qc.invalidateQueries({ queryKey: ["meeting", meetingId] });
    await qc.invalidateQueries({ queryKey: ["meetings"] });
    await qc.invalidateQueries({ queryKey: ["stats"] });
  }

  async function handleAdd() {
    if (!text.trim()) {
      toast.error("Action item text is required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          assignee: assignee.trim() || null,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setText("");
      setAssignee("");
      setPriority("medium");
      setDueDate("");
      await invalidate();
      toast.success("Action item added");
    } catch {
      toast.error("Could not add action item");
    } finally {
      setAdding(false);
    }
  }

  async function toggleComplete(item: ActionItem, val: boolean) {
    await patchItem(item.id, meetingId, { completed: val }, qc, invalidate);
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/action-items/${id}`, { method: "DELETE" });
    if (res.ok) {
      await invalidate();
      toast.success("Action item removed");
    }
  }

  async function changePriority(item: ActionItem, p: string) {
    await patchItem(item.id, meetingId, { priority: p }, qc, invalidate);
  }

  return (
    <div className="space-y-5">
      {/* Add new */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Add an action item
        </p>
        <div className="flex flex-col gap-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Send the proposal to NorthStar by Friday"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className="h-9"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-9 gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)} priority
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding}
              className="gap-1.5 bg-primary text-primary-foreground hover:opacity-90"
            >
              {adding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Open items */}
      {open.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Open
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {open.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {open.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                onToggle={(v) => toggleComplete(item, v)}
                onDelete={() => deleteItem(item.id)}
                onPriority={(p) => changePriority(item, p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Completed
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {done.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {done.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                onToggle={(v) => toggleComplete(item, v)}
                onDelete={() => deleteItem(item.id)}
                onPriority={(p) => changePriority(item, p)}
              />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No action items yet. Add the first task above.
        </div>
      )}
    </div>
  );
}

function ActionRow({
  item,
  onToggle,
  onDelete,
  onPriority,
}: {
  item: ActionItem;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
  onPriority: (p: string) => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <Checkbox
        checked={item.completed}
        onCheckedChange={(v) => onToggle(!!v)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            item.completed && "text-muted-foreground line-through",
          )}
        >
          {item.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {item.assignee && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {item.assignee}
            </span>
          )}
          {item.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <Select
            value={item.priority}
            onValueChange={onPriority}
          >
            <SelectTrigger className="h-5 w-auto gap-1 border-0 px-1 text-[11px] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 transition hover:text-destructive group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

async function patchItem(
  id: string,
  meetingId: string,
  patch: any,
  qc: ReturnType<typeof useQueryClient>,
  invalidate: () => Promise<void>,
) {
  const res = await fetch(`/api/action-items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (res.ok) {
    await invalidate();
  } else {
    toast.error("Update failed");
  }
}
