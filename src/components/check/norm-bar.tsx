import type { Percentile } from "@/lib/reading/norms";

type Props = {
  wcpm: number;
  values: Record<Percentile, number>;
  childName: string;
};

/** Where the score sits against the norms: below the 25th, 25th–50th, and the 50th and up. */
export function NormBar({ wcpm, values, childName }: Props) {
  const max = Math.max(values[90] * 1.12, wcpm + 10);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const name = childName.trim() || "Score";

  return (
    <div className="pt-9 pb-14">
      <div className="relative h-4 rounded-full bg-good-soft">
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-bad-soft" style={{ width: pct(values[25]) }} />
        <div className="absolute inset-y-0 bg-warn-soft" style={{ left: pct(values[25]), width: `calc(${pct(values[50])} - ${pct(values[25])})` }} />
        {([10, 25, 50, 75, 90] as const).map((p) => (
          <div
            key={p}
            className={`absolute top-full mt-1 -translate-x-1/2 text-center text-xs text-ink-soft ${p === 10 || p === 90 ? "hidden sm:block" : ""}`}
            style={{ left: pct(values[p]) }}
          >
            <div className="mx-auto h-2 w-px bg-ink-faint" />
            <span className={p === 50 ? "font-semibold text-ink" : ""}>
              {p === 50 ? "typical" : `${p}th`}
              <br />
              {values[p]}
            </span>
          </div>
        ))}
        <div className="absolute bottom-full mb-1 -translate-x-1/2 whitespace-nowrap" style={{ left: pct(wcpm) }}>
          <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">
            {name}: {wcpm}
          </span>
          <div className="mx-auto h-2 w-0.5 bg-ink" />
        </div>
      </div>
    </div>
  );
}
