"use client";

import { useState } from "react";
import { nextReminderStart, weeklyReminderIcs } from "@/lib/calendar";

type Props = {
  childName: string;
  childId: string | null;
  className?: string;
};

/** Downloads a weekly calendar reminder for the next four checks. */
export function ReminderButton({ childName, childId, className = "" }: Props) {
  const [done, setDone] = useState(false);

  function download() {
    const now = new Date();
    const url = `${window.location.origin}/check${childId ? `?child=${encodeURIComponent(childId)}` : ""}`;
    const ics = weeklyReminderIcs({ childName, url, start: nextReminderStart(now), now, uid: crypto.randomUUID() });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    link.download = "readbuddy-weekly-reminder.ics";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setDone(true);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={download}
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-deep underline-offset-4 hover:underline"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        Add a weekly reminder to my calendar
      </button>
      {done ? (
        <p role="status" className="text-sm text-ink-soft">
          Open the downloaded file to add 4 weekly checks, next one a week from today at 6 pm.
        </p>
      ) : null}
    </div>
  );
}
