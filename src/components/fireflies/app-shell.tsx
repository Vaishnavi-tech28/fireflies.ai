"use client";

import { useAppStore } from "@/store/app-store";
import { Sidebar } from "@/components/fireflies/sidebar";
import { Topbar } from "@/components/fireflies/topbar";
import { Footer } from "@/components/fireflies/footer";
import { Dashboard } from "@/components/dashboard/dashboard";
import { MeetingDetail } from "@/components/meeting/meeting-detail";

export function AppShell() {
  const view = useAppStore((s) => s.view);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1">
            {view.type === "meeting" ? (
              <MeetingDetail meetingId={view.meetingId} />
            ) : (
              <Dashboard />
            )}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
