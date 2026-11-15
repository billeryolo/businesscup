"use client";

// Home: the 4-week path from the last check to a realistic goal. One dot per day, a flag on
// each weekly check day, and one line saying what to do now. The reason to come back tomorrow.

import { motion } from "motion/react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { todayFor } from "@/lib/plan/today";
import { weeklyReminderIcs } from "@/lib/calendar";
import { type DayStatus, remainingCheckDays, type Roadmap, roadmapFor } from "@/lib/roadmap";
import type { CheckRecord } from "@/lib/store/checks";
import type { Kid } from "@/lib/store/family";
import { PlusNote } from "@/components/plus-note";

const card = "rounded-[28px] bg-white p-5 shadow-[0_6px_20px_rgba(27,20,51,0.06)]";

const DOT: Record<DayStatus, string> = {
  done: "bg-mint",
  todayDone: "bg-mint ring-2 ring-night ring-offset-2",
  missed: "bg-night/10",
  today: "bg-white ring-2 ring-night ring-offset-2",
  upcoming: "border-2 border-night/15 bg-white",
};

const LABEL: Record<DayStatus, string> = {
  done: "done",
  todayDone: "today, done",
  missed: "missed",
  today: "today",
  upcoming: "coming up",
};

function Week({ week, roadmap }: { week: Roadmap["weeks"][number]; roadmap: Roadmap }) {
  const current = roadmap.today > (week.week - 1) * 7 && roadmap.today <= week.week * 7;
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-2.5 py-2 ${current ? "bg-lilac-soft" : ""}`}>
      <span className="w-12 flex-none text-xs font-semibold text-night-soft">Week {week.week}</span>
      <div className="flex flex-1 items-center justify-between">
        {week.days.map((d) =>
          d.check ? (
            <span
              key={d.n}
              title={`Day ${d.n}: check, aim ${week.aim} (${LABEL[d.status]})`}
              aria-label={`Day ${d.n}: check day, aim ${week.aim}, ${LABEL[d.status]}`}
              className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[11px] font-bold ${d.status === "done" || d.status === "todayDone" ? "bg-mint" : d.status === "today" ? "bg-peach ring-2 ring-night ring-offset-2" : "bg-peach/50"}`}
            >
              {week.got ?? week.aim}
            </span>
          ) : (
            <span key={d.n} title={`Day ${d.n}: ${LABEL[d.status]}`} aria-label={`Day ${d.n}: practice, ${LABEL[d.status]}`} className={`h-3.5 w-3.5 rounded-full ${DOT[d.status]}`} />
          ),
        )}
      </div>
    </div>
  );
}

export function RoadmapCard({ kid, checks }: { kid: Kid; checks: CheckRecord[] }) {
  const roadmap = roadmapFor(kid, checks, new Date());

  if (!roadmap) {
    return (
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">4-week path</p>
        <p className="mt-2 text-[15px] leading-snug">A 1-minute check sets {kid.name}’s starting point and a goal for the next 4 weeks.</p>
        <motion.div whileTap={{ scale: 0.96 }} className="mt-4">
          <Link href="/checkup" className="flex h-12 items-center justify-center rounded-full bg-night text-[15px] font-semibold text-white">
            Start the path
          </Link>
        </motion.div>
      </div>
    );
  }

  const firstGame = todayFor(kid)[0];
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-night-soft">4-week path</p>
        <span className="flex-none rounded-full bg-mist px-2.5 py-1 text-xs font-semibold">
          {roadmap.today === 0 ? "Starts tomorrow" : `Day ${roadmap.today} of 28`}
        </span>
      </div>
      <p className="mt-3 text-[19px] font-semibold leading-snug">
        {roadmap.start} → {roadmap.goal} <span className="text-[15px] font-medium text-night-soft">{roadmap.unit}</span>
      </p>
      <p className="mt-0.5 text-xs text-night-soft">Weekly aims follow typical growth for {kid.name}’s grade, not a guess.</p>

      <div className="mt-3 grid gap-1">
        {roadmap.weeks.map((w) => (
          <Week key={w.week} week={w} roadmap={roadmap} />
        ))}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[15px] leading-snug">
        {roadmap.action === null ? <Icon name="check" size={20} /> : null}
        <span>{roadmap.next}</span>
      </p>

      {roadmap.action ? (
        <motion.div whileTap={{ scale: 0.96 }} className="mt-4">
          <Link
            href={roadmap.action === "check" ? "/checkup" : `/play/${firstGame.id}`}
            className="flex h-12 items-center justify-center rounded-full bg-night text-[15px] font-semibold text-white"
          >
            {roadmap.action === "check" ? "Do this week’s check" : `Start today: ${firstGame.title}`}
          </Link>
        </motion.div>
      ) : null}

      <CalendarButton kid={kid} roadmap={roadmap} />
      <PlusNote className="mt-3" />
    </div>
  );
}

/** Puts the remaining weekly check days in the parent's own calendar, with an alert at 6 pm. */
function CalendarButton({ kid, roadmap }: { kid: Kid; roadmap: Roadmap }) {
  const now = new Date();
  const left = remainingCheckDays(roadmap, now);
  if (!left) return null;
  function add() {
    const ics = weeklyReminderIcs({ childName: kid.name, url: `${window.location.origin}/checkup`, start: left!.start, now, weeks: left!.count, uid: `${kid.id}-${left!.start.getTime()}` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = "readbuddy-check-days.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  }
  return (
    <button type="button" onClick={add} className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-mist text-sm font-semibold">
      Add {left.count === 1 ? "the next check day" : `the ${left.count} check days`} to my calendar
    </button>
  );
}
