"use client";

import { ChevronLeft, Bell, HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/fireflies/theme-toggle";
import { GlobalSearch } from "@/components/fireflies/global-search";
import { useAppStore } from "@/store/app-store";
import { UserAvatar } from "@/components/fireflies/user-avatar";

export function Topbar() {
  const view = useAppStore((s) => s.view);
  const backToDashboard = useAppStore((s) => s.backToDashboard);
  const inMeeting = view.type === "meeting";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      {inMeeting ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={backToDashboard}
          className="gap-1 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">All meetings</span>
        </Button>
      ) : (
        <h1 className="hidden text-base font-semibold md:block">Dashboard</h1>
      )}

      <div className="flex flex-1 justify-center px-2">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 rounded-lg bg-primary px-3 text-primary-foreground hover:opacity-90 sm:flex"
          onClick={() => window.dispatchEvent(new CustomEvent("ff:create-meeting"))}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">New</span>
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 rounded-full sm:inline-flex"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        <button
          className="ml-1 rounded-full ring-2 ring-transparent transition hover:ring-primary/40"
          aria-label="Your profile"
          title="You (default account)"
        >
          <UserAvatar name="You" color="#f59e0b" size="md" />
        </button>
      </div>
    </header>
  );
}
