"use client";

import { create } from "zustand";

export type AppView =
  | { type: "dashboard" }
  | { type: "meeting"; meetingId: string };

type AppState = {
  view: AppView;
  // global (cross-meeting) search query entered in the topbar
  globalSearch: string;
  openMeeting: (id: string) => void;
  backToDashboard: () => void;
  setGlobalSearch: (q: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  view: { type: "dashboard" },
  globalSearch: "",
  openMeeting: (id) =>
    set({ view: { type: "meeting", meetingId: id } }),
  backToDashboard: () => set({ view: { type: "dashboard" } }),
  setGlobalSearch: (q) => set({ globalSearch: q }),
}));
