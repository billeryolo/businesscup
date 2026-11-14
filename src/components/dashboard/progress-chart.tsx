import type { Percentile } from "@/lib/reading/norms";

/** Same output on the server and in the browser, so the page hydrates cleanly. */
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Point = { id: string; wcpm: number; readAt: string };

type Props = {
  points: Point[];
  norms: Record<Percentile, number>;
  /** E.g. "2nd grade in the fall". */
  normLabel: string;
};

const W = 600;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 30, left: 36 };

/** Words correct per minute over time, against the typical score and the 25th percentile. */
export function ProgressChart({ points, norms, normLabel }: Props) {
  const max = Math.max(norms[75] * 1.15, ...points.map((p) => p.wcpm + 10));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const latest = points[points.length - 1];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Words correct per minute over ${points.length} readings, latest ${latest?.wcpm ?? 0}. Typical for ${normLabel}: ${norms[50]}.`}
      >
        <rect x={PAD.left} y={y(norms[25])} width={innerW} height={y(0) - y(norms[25])} className="fill-bad-soft" />
        <rect x={PAD.left} y={y(norms[50])} width={innerW} height={y(norms[25]) - y(norms[50])} className="fill-warn-soft" />
        <line x1={PAD.left} x2={W - PAD.right} y1={y(norms[50])} y2={y(norms[50])} className="stroke-ink-faint" strokeDasharray="6 5" strokeWidth={1.5} />
        <text x={W - PAD.right} y={y(norms[50]) - 6} textAnchor="end" className="fill-ink-soft text-[12px]">
          typical {norms[50]}
        </text>
        <text x={PAD.left - 8} y={y(0) + 4} textAnchor="end" className="fill-ink-faint text-[11px]">
          0
        </text>

        {points.length > 1 ? (
          <polyline points={points.map((p, i) => `${x(i)},${y(p.wcpm)}`).join(" ")} fill="none" className="stroke-brand" strokeWidth={3} strokeLinejoin="round" />
        ) : null}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={x(i)} cy={y(p.wcpm)} r={6} className="fill-brand stroke-sheet" strokeWidth={2} />
            <text x={x(i)} y={y(p.wcpm) - 12} textAnchor="middle" className="fill-ink text-[13px] font-semibold">
              {p.wcpm}
            </text>
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-soft text-[11px]">
              {shortDate(p.readAt)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-sm text-ink-soft">
        Words correct per minute. Dashed line: typical score for {normLabel} (Hasbrouck &amp; Tindal, 2017). Red: below the 25th percentile.
      </figcaption>
    </figure>
  );
}
