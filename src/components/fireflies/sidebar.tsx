"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  FileText,
  Home,
  ListChecks,
  Settings,
  Sparkles,
  Star,
  Tag as TagIcon,
  Users,
  Zap,
} from "lucide-react";
import { FireflyLogo } from "@/components/fireflies/firefly-logo";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const PRIMARY_NAV = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: FileText, label: "Notes", soon: true },
  { icon: Calendar, label: "Calendar", soon: true },
  { icon: ListChecks, label: "Action Items", soon: true },
  { icon: Star, label: "Soundbites", soon: true },
  { icon: Clock, label: "Recents", soon: true },
];

const SECONDARY_NAV = [
  { icon: Users, label: "Team", soon: true },
  { icon: Zap, label: "Integrations", soon: true },
  { icon: TagIcon, label: "Tags", soon: true },
  { icon: Settings, label: "Settings", soon: true },
];

export function Sidebar() {
  const backToDashboard = useAppStore((s) => s.backToDashboard);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      {/* Brand */}
      <button
        onClick={backToDashboard}
        className="flex h-16 items-center gap-2 px-5 transition hover:opacity-80"
      >
        <FireflyLogo className="h-8 w-8" />
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          Fireflies
        </span>
      </button>

      <div className="px-3 pb-3">
        <NewMeetingButton />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <NavSection items={PRIMARY_NAV} />
        <NavSection items={SECONDARY_NAV} />

        {/* Upgrade card */}
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-sidebar-foreground">
              AI Add-ons
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            AskFred, soundbites, and custom summaries.
          </p>
          <Link
            href="#"
            className="mt-2 inline-block rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Upgrade
          </Link>
        </div>
      </nav>
    </aside>
  );
}

function NavSection({
  items,
}: {
  items: { icon: any; label: string; soon?: boolean; active?: boolean }[];
}) {
  return (
    <div className="space-y-0.5 py-1">
      {items.map((item) => (
        <button
          key={item.label}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
            item.active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.soon && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[9px] font-medium uppercase"
            >
              Soon
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

function NewMeetingButton() {
  const openCreate = useAppStore((s) => s.openMeeting);
  return (
    <button
      onClick={() => {
        // Triggered from the dashboard; the dashboard listens for a custom event.
        window.dispatchEvent(new CustomEvent("ff:create-meeting"));
      }}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      <span className="text-lg leading-none">+</span>
      New Meeting
    </button>
  );
}
