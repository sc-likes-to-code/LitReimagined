"use client";

import { useMemo, useSyncExternalStore } from "react";
import { STREAK } from "@/config/streaks";
import { computeStreak, dayKey, type Activity } from "@/lib/reader/streaks";
import { createStore, useStore } from "./store";

/** Words read per local calendar day, kept on the device and synced for signed-in users. */
export const activityStore = createStore<Activity>("activity", {});

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Adds the words of a paragraph the reader has dwelled on to today's total. */
export function recordReading(paragraph: string) {
  const words = countWords(paragraph);
  if (words === 0) return;
  const today = dayKey(new Date());
  activityStore.set((prev) => ({ ...prev, [today]: (prev[today] ?? 0) + words }));
}

/** Empties the local reading history (used on sign-out). */
export function clearActivity() {
  activityStore.set({});
}

const subscribeToClock = (onChange: () => void) => {
  // Re-check every half minute so a streak rolls over at midnight without a reload.
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
};

/** Today's local date key. Empty on the server so markup matches until the client takes over. */
export function useToday(): string {
  return useSyncExternalStore(
    subscribeToClock,
    () => dayKey(new Date()),
    () => "",
  );
}

export function useStreak() {
  const activity = useStore(activityStore);
  const today = useToday();
  const summary = useMemo(
    () => computeStreak(activity, today, STREAK.dailyWords),
    [activity, today],
  );
  return { activity, today, goal: STREAK.dailyWords, ...summary };
}
