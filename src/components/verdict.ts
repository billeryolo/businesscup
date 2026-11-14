import type { Verdict } from "@/lib/reading/assess";

export const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  onTrack: { label: "On track", cls: "bg-good-soft text-good" },
  practice: { label: "Could use some practice", cls: "bg-warn-soft text-warn" },
  talkToTeacher: { label: "Worth talking to the teacher", cls: "bg-bad-soft text-bad" },
};

export const ORDINAL = ["", "1st", "2nd", "3rd", "4th"];
