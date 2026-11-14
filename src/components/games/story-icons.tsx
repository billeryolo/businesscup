// The things a story can be about, drawn soft like the rest of the app's icons: no outlines,
// light from the top left, a soft shadow underneath.

import { useId } from "react";
import type { TopicId } from "@/lib/games/story";

const TONES = {
  green: ["#C4F2D6", "#5FCF9A", "#2FA877"],
  lilac: ["#E3DCFF", "#A594F5", "#7460DC"],
  orange: ["#FFE0B8", "#FFAA5C", "#EE7F2B"],
  brown: ["#F3D7B8", "#D49A62", "#AE7440"],
  red: ["#FFC2BE", "#FF7A70", "#E4483F"],
  blue: ["#CDEBFF", "#6DBDF7", "#3D93DC"],
  gold: ["#FFF0A6", "#FFD04A", "#F7AE1F"],
  white: ["#FFFFFF", "#F4F1FF", "#DDD6FA"],
} as const;
type Tone = keyof typeof TONES;
const INK = "#2B2350";

function art(topic: TopicId, u: (t: Tone) => string): { tones: Tone[]; body: React.ReactNode } {
  switch (topic) {
    case "dinosaurs":
      return {
        tones: ["green", "gold"],
        body: (
          <>
            <path d="M9 33c-4 1-6.500-.500-7-3 3 1 5-.500 7-3z" fill={u("green")} />
            <rect x="14" y="35" width="6" height="8" rx="3" fill={TONES.green[2]} />
            <rect x="25" y="35" width="6" height="8" rx="3" fill={TONES.green[2]} />
            <ellipse cx="21" cy="30" rx="13.500" ry="9.500" fill={u("green")} />
            <path d="M27 27c1-8 2-14 4-17h8v8c-2 4-3 9-3 13z" fill={u("green")} />
            <rect x="29" y="5" width="15" height="11" rx="5.500" fill={u("green")} />
            <circle cx="37" cy="9.500" r="1.500" fill={INK} />
            <path d="M38.500 13c1.200.600 2.400.600 3.500 0" fill="none" stroke={INK} strokeWidth="1.100" strokeLinecap="round" opacity="0.7" />
            <circle cx="16" cy="27" r="2.200" fill={u("gold")} />
            <circle cx="23" cy="31" r="1.700" fill={u("gold")} />
            <circle cx="21" cy="24.500" r="1.300" fill={u("gold")} />
          </>
        ),
      };
    case "space":
      return {
        tones: ["white", "red", "blue", "gold"],
        body: (
          <g transform="rotate(35 24 24)">
            <path d="M19 36c0 4 2 7 5 9 3-2 5-5 5-9z" fill={u("gold")} />
            <path d="M15 24l-6 8v5l8-3zM33 24l6 8v5l-8-3z" fill={u("red")} />
            <path d="M24 3c6 5 9 12 9 20v11a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V23c0-8 3-15 9-20z" fill={u("white")} />
            <path d="M24 3c2.700 2.200 4.800 5 6.200 8H17.800c1.400-3 3.500-5.800 6.200-8z" fill={u("red")} />
            <circle cx="24" cy="21" r="5" fill={TONES.blue[2]} />
            <circle cx="24" cy="21" r="3.700" fill={u("blue")} />
            <ellipse cx="22.700" cy="19.700" rx="1.300" ry="0.800" fill="#fff" opacity="0.7" />
          </g>
        ),
      };
    case "cats":
      return {
        tones: ["orange", "white"],
        body: (
          <>
            <path d="M8 22 9 6l11 7zM40 22 39 6l-11 7z" fill={u("orange")} />
            <path d="M11.500 16 12 10l5 3.500zM36.500 16 36 10l-5 3.500z" fill="#FFC9D6" />
            <ellipse cx="24" cy="27" rx="17.500" ry="15.500" fill={u("orange")} />
            <ellipse cx="24" cy="33" rx="8" ry="6" fill={u("white")} />
            <circle cx="16.500" cy="25" r="2.300" fill={INK} />
            <circle cx="31.500" cy="25" r="2.300" fill={INK} />
            <circle cx="17.300" cy="24.200" r="0.800" fill="#fff" />
            <circle cx="32.300" cy="24.200" r="0.800" fill="#fff" />
            <path d="M22 30h4l-2 2.300z" fill="#F0719A" stroke="#F0719A" strokeWidth="1" strokeLinejoin="round" />
            <path d="M24 32.500c-.300 2-2 2.700-3.500 2M24 32.500c.300 2 2 2.700 3.500 2" fill="none" stroke={INK} strokeWidth="1.100" strokeLinecap="round" opacity="0.7" />
          </>
        ),
      };
    case "dogs":
      return {
        tones: ["brown", "white"],
        body: (
          <>
            <ellipse cx="24" cy="25" rx="15.500" ry="16" fill={u("brown")} />
            <path d="M10 11c-6 1-8 8-7 15 .600 4 3.500 5.500 6 4 2-4 3-10 5-15z" fill={TONES.brown[2]} />
            <path d="M38 11c6 1 8 8 7 15-.600 4-3.500 5.500-6 4-2-4-3-10-5-15z" fill={TONES.brown[2]} />
            <ellipse cx="24" cy="32" rx="9" ry="7.500" fill={u("white")} />
            <circle cx="17.500" cy="22" r="2.300" fill={INK} />
            <circle cx="30.500" cy="22" r="2.300" fill={INK} />
            <circle cx="18.300" cy="21.200" r="0.800" fill="#fff" />
            <circle cx="31.300" cy="21.200" r="0.800" fill="#fff" />
            <ellipse cx="24" cy="28.500" rx="3" ry="2.200" fill={INK} />
            <path d="M24 31v2.500" stroke={INK} strokeWidth="1.100" strokeLinecap="round" opacity="0.7" />
            <path d="M21.500 34.500h5a2.500 2.500 0 0 1-5 0z" fill="#F0719A" />
          </>
        ),
      };
    case "cars":
      return {
        tones: ["red", "blue", "gold"],
        body: (
          <>
            <path d="M12 21l4-9a3 3 0 0 1 2.700-1.800h10.600A3 3 0 0 1 32 12l4 9z" fill={u("red")} />
            <path d="M16.500 20l2.700-6h4v6zM25.200 14h3.600l2.700 6h-6.300z" fill={u("blue")} />
            <rect x="3" y="19" width="42" height="15" rx="6.500" fill={u("red")} />
            <rect x="39" y="23" width="5" height="4" rx="2" fill={u("gold")} />
            <rect x="4" y="23" width="3.500" height="4" rx="1.700" fill="#FFE9E7" />
            <circle cx="14" cy="34" r="6" fill={INK} />
            <circle cx="34" cy="34" r="6" fill={INK} />
            <circle cx="14" cy="34" r="2.600" fill="#DDD6FA" />
            <circle cx="34" cy="34" r="2.600" fill="#DDD6FA" />
            <ellipse cx="13" cy="22.500" rx="4" ry="1.200" fill="#fff" opacity="0.35" />
          </>
        ),
      };
    case "ocean":
      return {
        tones: ["orange", "gold", "blue"],
        body: (
          <>
            <path d="M33 24 45 13c1.500 7 1.500 15 0 22z" fill={u("gold")} />
            <path d="M18 13c3-5 8-6 12-4l-3 6zM20 35c2 4 6 5 9 3l-3-5z" fill={u("gold")} />
            <ellipse cx="21" cy="24" rx="17" ry="12" fill={u("orange")} />
            <path d="M22 13.200c3 3.500 3 18 0 21.600M28.500 14.500c2.500 3.500 2.500 15.500 0 19" fill="none" stroke="#fff" strokeWidth="2.600" strokeLinecap="round" opacity="0.8" />
            <circle cx="11.500" cy="21.500" r="2.600" fill="#fff" />
            <circle cx="11" cy="21.500" r="1.500" fill={INK} />
            <path d="M7 27.500c1.200 1 2.600 1.200 4 .800" fill="none" stroke={INK} strokeWidth="1.100" strokeLinecap="round" opacity="0.7" />
            <circle cx="5" cy="9" r="2.200" fill={u("blue")} opacity="0.9" />
            <circle cx="9.500" cy="4.500" r="1.400" fill={u("blue")} opacity="0.9" />
          </>
        ),
      };
  }
}

export function TopicIcon({ topic, size = 64 }: { topic: TopicId; size?: number }) {
  const id = useId();
  const { tones, body } = art(topic, (t) => `url(#${id}-${t})`);
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" style={{ filter: `drop-shadow(0 ${(size * 0.06).toFixed(2)}px ${(size * 0.08).toFixed(2)}px rgba(27,20,51,0.22))` }}>
      <defs>
        {tones.map((t) => (
          <radialGradient key={t} id={`${id}-${t}`} cx="0.32" cy="0.24" r="0.9">
            <stop offset="0" stopColor={TONES[t][0]} />
            <stop offset="0.5" stopColor={TONES[t][1]} />
            <stop offset="1" stopColor={TONES[t][2]} />
          </radialGradient>
        ))}
      </defs>
      {body}
    </svg>
  );
}
