// The pieces of the pages opened from Family (About, Privacy, Terms): a round back button and a
// title, then white cards, each with a small coloured tile, a heading and a few plain sentences.

import Link from "next/link";
import type { ReactNode } from "react";
import { Stagger } from "@/components/app/screen";

const soft = "shadow-[0_6px_20px_rgba(27,20,51,0.06)]";

export type InfoGlyph = "buddy" | "people" | "timer" | "calendar" | "wrench" | "phone" | "trash" | "mic" | "spark" | "speaker" | "shield" | "book" | "gauge" | "hand" | "box";

const GLYPHS: Record<InfoGlyph, ReactNode> = {
  buddy: (
    <>
      <path d="M12 6.800C10.200 5.500 7.500 5 4.500 5.400v12c3-.4 5.700.1 7.500 1.400 1.800-1.300 4.500-1.800 7.500-1.400v-12c-3-.4-5.700.1-7.500 1.400z" />
      <path d="M12 6.800v12" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.500" r="3.200" />
      <path d="M3.200 19.500a5.800 5.800 0 0 1 11.600 0" />
      <circle cx="17.500" cy="10" r="2.300" />
      <path d="M16.800 14.600a4.300 4.300 0 0 1 4 4.900" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.500" r="7" />
      <path d="M12 13.500V9.800M9.800 3.500h4.400" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.500" width="16" height="14.500" rx="3" />
      <path d="M4 10.500h16M8.500 3.500v3.500M15.500 3.500v3.500" />
    </>
  ),
  wrench: <path d="M14.200 6.300a4 4 0 0 0-5.300 5.300l-5 5a1.800 1.800 0 0 0 2.500 2.500l5-5a4 4 0 0 0 5.300-5.300l-2.600 2.600-2.500-2.500z" transform="translate(1.500 0)" />,
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.600" />
      <path d="M11 17.800h2" />
    </>
  ),
  trash: (
    <>
      <path d="M4.500 7h15M9.500 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M6.500 7l.8 11.200a1.800 1.800 0 0 0 1.800 1.800h5.800a1.800 1.800 0 0 0 1.800-1.800L17.500 7M10.200 11v5M13.800 11v5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3.500" width="6" height="10.500" rx="3" />
      <path d="M5.800 11.500a6.200 6.200 0 0 0 12.400 0M12 17.700v2.800" />
    </>
  ),
  spark: (
    <>
      <path d="M11 4l1.800 4.700 4.700 1.800-4.700 1.800L11 17l-1.800-4.700-4.700-1.800 4.700-1.800z" />
      <path d="M18.200 15.200l.7 1.900 1.900.7-1.900.7-.7 1.900-.7-1.900-1.900-.7 1.900-.7z" />
    </>
  ),
  speaker: (
    <>
      <path d="M4.500 9.800h3L12 6v12l-4.500-3.800h-3a.8.8 0 0 1-.8-.8v-2.800a.8.8 0 0 1 .8-.8z" />
      <path d="M15.500 9.200a4 4 0 0 1 0 5.600M18 6.800a7.400 7.400 0 0 1 0 10.400" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.500l7 2.600v5.400c0 4.200-2.800 7.600-7 9-4.200-1.400-7-4.800-7-9V6.100z" />
      <path d="M9 12l2.200 2.200L15.200 10" />
    </>
  ),
  book: (
    <>
      <path d="M6 4.500h10.500a1.500 1.500 0 0 1 1.500 1.500v13.500H7.500A1.500 1.500 0 0 1 6 18z" />
      <path d="M6 18a1.500 1.500 0 0 1 1.500-1.500H18M9.500 8.500h5" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.500 17a8 8 0 1 1 15 0" />
      <path d="M12 14.500l3.500-4.500" />
    </>
  ),
  hand: (
    <>
      <circle cx="8.500" cy="7.500" r="3" />
      <path d="M3 19.500a5.500 5.500 0 0 1 11 0" />
      <circle cx="17" cy="11.500" r="2.200" />
      <path d="M13.800 19.500a3.300 3.300 0 0 1 6.500 0" />
    </>
  ),
  box: (
    <>
      <path d="M12 3.500l7.500 4v9l-7.500 4-7.500-4v-9z" />
      <path d="M4.500 7.500l7.500 4 7.500-4M12 11.500v9" />
    </>
  ),
};

function Glyph({ name }: { name: InfoGlyph }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {GLYPHS[name]}
    </svg>
  );
}

const TONES = { lilac: "bg-lilac-soft", mint: "bg-mint/70", peach: "bg-peach/60", candy: "bg-candy/50" } as const;
export type InfoTone = keyof typeof TONES;

/** One white card: a coloured tile with a drawing, a heading, and the text under it. */
export function InfoCard({ glyph, tone, title, children }: { glyph: InfoGlyph; tone: InfoTone; title: string; children: ReactNode }) {
  return (
    <section className={`rounded-[28px] bg-white p-5 ${soft}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 flex-none place-items-center rounded-2xl ${TONES[tone]}`}>
          <Glyph name={glyph} />
        </span>
        <h2 className="text-[17px] font-semibold leading-snug">{title}</h2>
      </div>
      <div className="mt-3 grid gap-2.5 text-[15px] leading-relaxed text-night/85">{children}</div>
    </section>
  );
}

/** A short list inside a card, with the app's round bullets. */
export function InfoList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[9px] h-2 w-2 flex-none rounded-full bg-candy" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const OTHERS = [
  { href: "/about", text: "About ReadBuddy" },
  { href: "/privacy", text: "Privacy" },
  { href: "/terms", text: "Terms" },
];

/** The whole page: back to Family, the title, the cards, then links to the other two pages. */
export function InfoPage({ path, kicker, title, lead, children }: { path: string; kicker: string; title: string; lead: string; children: ReactNode[] }) {
  return (
    <Stagger className="grid gap-4">
      {[
        <header key="head" className="pb-1">
          <Link href="/family" aria-label="Back to Family" className={`grid h-11 w-11 place-items-center rounded-full bg-white ${soft}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.500 5.500 8 12l6.500 6.500" />
            </svg>
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-night-soft">{kicker}</p>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-night-soft">{lead}</p>
        </header>,
        ...children,
        <nav key="more" aria-label="More about ReadBuddy" className={`rounded-[28px] bg-white px-5 py-2 ${soft}`}>
          {OTHERS.filter((o) => o.href !== path).map((o, i) => (
            <Link key={o.href} href={o.href} className={`flex h-12 items-center justify-between text-[15px] font-medium ${i ? "border-t border-night/5" : ""}`}>
              {o.text}
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-night/40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9.500 5.500 16 12l-6.500 6.500" />
              </svg>
            </Link>
          ))}
        </nav>,
        <Link key="back" href="/family" className="flex h-12 items-center justify-center rounded-full bg-night text-[15px] font-semibold text-white">
          Back to Family
        </Link>,
      ]}
    </Stagger>
  );
}
