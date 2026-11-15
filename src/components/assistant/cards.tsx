"use client";

// Action cards under an assistant reply: what the assistant did or proposes. Saved notes and
// logged minutes can be undone; a change to the daily minutes waits for Apply.

import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Card } from "@/lib/assistant/actions";

const box = "mt-2 rounded-[20px] bg-white p-3.5 text-sm shadow-[0_6px_20px_rgba(27,20,51,0.06)]";
const pill = "inline-flex h-9 items-center rounded-full px-3.5 text-xs font-semibold";

function Spark({ scores, target }: { scores: number[]; target: number }) {
  const w = 220;
  const h = 56;
  const max = Math.max(target, ...scores) * 1.1;
  const min = Math.min(target, ...scores) * 0.6;
  const x = (i: number) => (scores.length === 1 ? w / 2 : 8 + ((w - 16) * i) / (scores.length - 1));
  const y = (v: number) => 6 + (h - 12) * (1 - (v - min) / (max - min));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" role="img" aria-label={`Scores ${scores.join(", ")}, goal ${target}`}>
      <line x1="0" x2={w} y1={y(target)} y2={y(target)} stroke="#1b1433" strokeOpacity="0.25" strokeDasharray="2 5" />
      <polyline points={scores.map((s, i) => `${x(i)},${y(s)}`).join(" ")} fill="none" stroke="#9a88f2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => (
        <circle key={i} cx={x(i)} cy={y(s)} r={i === scores.length - 1 ? 4.5 : 3} fill="#fff" stroke="#7b67e0" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function ActionCards({ cards, kidName, onChange }: { cards: Card[]; kidName: string; onChange: (index: number, card: Card, action: "undo" | "apply" | "decline" | "undoApply") => void }) {
  return (
    <div className="grid gap-0">
      {cards.map((c, i) => {
        if (c.kind === "diary" || c.kind === "minutes") {
          const text = c.kind === "diary" ? `Saved to ${kidName}’s diary` : `Logged ${c.minutes} minutes of reading together for today`;
          return (
            <div key={i} className={`${box} flex items-center gap-3`}>
              <Icon name={c.undone ? "plus" : "check"} size={20} />
              <span className="min-w-0 flex-1">{c.undone ? "Not saved" : text}</span>
              {!c.undone && (
                <button type="button" onClick={() => onChange(i, { ...c, undone: true }, "undo")} className={`${pill} bg-mist`}>
                  Undo
                </button>
              )}
            </div>
          );
        }
        if (c.kind === "change") {
          return (
            <div key={i} className={box}>
              <p className="font-semibold">
                Daily practice: {c.from} → {c.to} minutes
              </p>
              {c.status === "pending" ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => onChange(i, { ...c, status: "applied" }, "apply")} className={`${pill} bg-night text-white`}>
                    Apply
                  </button>
                  <button type="button" onClick={() => onChange(i, { ...c, status: "declined" }, "decline")} className={`${pill} bg-mist`}>
                    Not now
                  </button>
                </div>
              ) : c.status === "applied" ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-night-soft">Applied.</span>
                  <button type="button" onClick={() => onChange(i, { ...c, status: "pending" }, "undoApply")} className={`${pill} bg-mist`}>
                    Undo
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-night-soft">Left as it is.</p>
              )}
            </div>
          );
        }
        if (c.kind === "chart") {
          return (
            <Link key={i} href="/progress" className={`${box} block`}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{c.scores[c.scores.length - 1]} {c.label}</span>
                <span className="text-xs text-night-soft">{c.change ?? `goal ${c.target}`}</span>
              </span>
              <Spark scores={c.scores} target={c.target} />
              <span className="mt-1 block text-xs font-semibold text-night-soft">Open Progress →</span>
            </Link>
          );
        }
        if (c.kind === "open") {
          return (
            <Link key={i} href={c.href} className={`${box} flex items-center justify-between font-semibold`}>
              {c.label}
              <span aria-hidden="true">→</span>
            </Link>
          );
        }
        return (
          <Link key={i} href="/report" className={`${box} flex items-center justify-between font-semibold`}>
            Open the one-page report for the teacher
            <span aria-hidden="true">→</span>
          </Link>
        );
      })}
    </div>
  );
}
