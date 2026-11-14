import { syllabify } from "@/lib/reading/syllables";

/**
 * A word split into syllables with a dot between parts and every other part in a second color.
 * Screen readers get the whole word.
 */
export function SyllableWord({ display, className = "" }: { display: string; className?: string }) {
  const parts = syllabify(display);
  if (parts.length < 2) return <>{display}</>;
  return (
    <>
      <span aria-hidden="true" className={className}>
        {parts.map((part, i) => (
          // The dot stays with the syllable before it, so a wrapped line never starts with one.
          <span key={i} className="inline-block whitespace-nowrap">
            <span className={i % 2 ? "text-brand-deep" : undefined}>{part}</span>
            {i < parts.length - 1 ? <span className="mx-[0.06em] text-ink-faint">·</span> : null}
          </span>
        ))}
      </span>
      <span className="sr-only">{display}</span>
    </>
  );
}
