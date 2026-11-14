/** The assistant's pearl: a soft lilac sphere with pink and sky light turning inside. */
export function Orb({ size, busy = false, className = "" }: { size: number; busy?: boolean; className?: string }) {
  return (
    <span className={`pearl ${className}`} data-busy={busy} style={{ fontSize: size }} aria-hidden="true">
      <span className="pearl-swirl" />
      <span className="pearl-shine" />
    </span>
  );
}
