"use client";

// Backend test bench: unstyled on purpose. The real screens are built separately on the same store.

import { useState } from "react";
import { domainsForGrade, gradeLabel } from "@/lib/checks/norms";
import { getStore } from "@/lib/store";
import { useAppData } from "@/lib/use-store";
import { GRADE_LEVELS, type GradeLevel } from "@/lib/types";

export default function DevPage() {
  const data = useAppData();
  const store = getStore();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<GradeLevel>(2);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => void) => {
    setError(null);
    try {
      fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main style={{ fontFamily: "monospace", padding: 16, maxWidth: 900 }}>
      <h1>/dev: store</h1>
      <p>
        <button onClick={() => run(() => store.loadDemoFamily())}>Load demo family</button>{" "}
        <button onClick={() => run(() => store.deleteAllData())}>Delete all data</button>
      </p>
      <p>
        <input placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} />{" "}
        <select value={String(grade)} onChange={(e) => setGrade(GRADE_LEVELS.find((g) => String(g) === e.target.value) ?? 2)}>
          {GRADE_LEVELS.map((g) => (
            <option key={String(g)} value={String(g)}>{gradeLabel(g)}</option>
          ))}
        </select>{" "}
        <button onClick={() => run(() => store.addChild({ firstName: name, grade, avatar: "owl" }))}>Add child</button>
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {data.children.map((c) => {
        const stats = store.stats(c.id);
        const plan = store.currentPlan(c.id);
        return (
          <section key={c.id} style={{ borderTop: "1px solid #999", marginTop: 16 }}>
            <h2>
              {c.firstName} · {gradeLabel(c.grade)}{" "}
              <button onClick={() => run(() => store.deleteChild(c.id))}>delete</button>
            </h2>
            <pre>{JSON.stringify(stats, null, 2)}</pre>
            {domainsForGrade(c.grade).map((d) => {
              const p = store.progress(c.id, d);
              return (
                <p key={d}>
                  <b>{d}</b>: {p.points.map((x) => x.value).join(" → ") || "no checks"} {p.summary && `(${p.summary})`}
                </p>
              );
            })}
            <h3>Results</h3>
            <ul>
              {data.results
                .filter((r) => r.childId === c.id)
                .map((r) => (
                  <li key={r.id}>
                    {r.takenAt.slice(0, 10)} {r.kind} {r.perMinute} {r.verdict ?? "no verdict"} ({r.norm?.sourceName ?? "no norm"}
                    {r.norm?.source === "estimate" ? ", estimate" : ""})
                  </li>
                ))}
            </ul>
            <h3>Plan</h3>
            {plan ? <pre>{JSON.stringify({ minutes: plan.minutesPerDay, focus: plan.focus, weeks: plan.weeks.map((w) => w.goal) }, null, 2)}</pre> : <p>none</p>}
          </section>
        );
      })}

      <details style={{ marginTop: 24 }}>
        <summary>Raw AppData</summary>
        <pre>{JSON.stringify({ ...data, results: `${data.results.length} results` }, null, 2)}</pre>
      </details>
    </main>
  );
}
