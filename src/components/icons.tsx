// The app's own icons, drawn here so nothing depends on the phone's emoji font. The coloured ones
// are soft and rounded like the avatars: no outlines, a light from the top left, a deeper tone
// underneath for a little depth. Play, backspace and check are plain glyphs in the text colour.

import { useId } from "react";

export type IconName = "star" | "flame" | "book" | "letters" | "bolt" | "plus" | "wand" | "play" | "backspace" | "check";

const STAR = "M12 3.200l2.500 5.500 6 .700-4.500 4 1.300 5.900L12 16.300l-5.300 3 1.300-5.900-4.500-4 6-.700z";
const BOLT = "M13.300 3.200 6 13.200h5l-1 7.600L18 10.800h-5z";
const PLUS = "M10 4.500h4V10h5.500v4H14v5.500h-4V14H4.500v-4H10z";
const FLAME = "M12 2.800c.6 3.100 5.300 5.400 5.300 10.700a5.300 5.300 0 0 1-10.600 0c0-1.900.9-3.300 1.900-4.300.3 1.200 1 1.900 1.700 2.200C10.100 8.300 10.600 5.200 12 2.800z";

/** Three tones, lit to shaded, plus the deeper tone that peeks out underneath. */
const PAINT = {
  gold: ["#FFF0A6", "#FFD04A", "#F7AE1F", "#E08A12"],
  fire: ["#FFC08A", "#FF8448", "#F0592E", "#CF4322"],
  ember: ["#FFF3B0", "#FFD24A", "#FFB52E", "#FFB52E"],
  orange: ["#FFD0A0", "#FFA155", "#F27F2E", "#D4661D"],
  mint: ["#B4F0D4", "#58CF9C", "#35B080", "#23936A"],
  lilac: ["#C9BEFF", "#9A88F2", "#7B67E0", "#614FC4"],
  pink: ["#FFC4EC", "#FF8FD8", "#F06CC2", "#D452A7"],
  page: ["#FFFFFF", "#F6F3FF", "#E4DEFF", "#E4DEFF"],
} as const;
type Paint = keyof typeof PAINT;

/** A shape with rounded corners: a deeper copy slightly below, the lit shape on top. */
function Soft({ d, paint, u, round = 1.6, transform }: { d: string; paint: Paint; u: (p: Paint) => string; round?: number; transform?: string }) {
  return (
    <g transform={transform} strokeLinejoin="round" strokeLinecap="round" strokeWidth={round}>
      <path d={d} transform="translate(0 0.900)" fill={PAINT[paint][3]} stroke={PAINT[paint][3]} />
      <path d={d} fill={u(paint)} stroke={u(paint)} />
    </g>
  );
}

function draw(name: IconName, u: (p: Paint) => string): { paints: Paint[]; art: React.ReactNode } {
  switch (name) {
    case "star":
      return { paints: ["gold"], art: <><Soft d={STAR} paint="gold" u={u} /><ellipse cx="9.300" cy="8.800" rx="2.200" ry="1.100" transform="rotate(-28 9.300 8.800)" fill="#fff" opacity="0.55" /></> };
    case "flame":
      return {
        paints: ["fire", "ember"],
        art: (
          <>
            <Soft d={FLAME} paint="fire" u={u} round={1} />
            <path d="M12 12.600c1.300 1.300 2.300 2.400 2.300 3.900a2.300 2.300 0 0 1-4.600 0c0-1.500 1-2.600 2.300-3.900z" fill={u("ember")} />
          </>
        ),
      };
    case "book":
      return {
        paints: ["lilac", "page"],
        art: (
          <>
            <rect x="2.600" y="6.200" width="18.800" height="13.800" rx="2.600" fill={PAINT.lilac[3]} />
            <rect x="2.600" y="5.400" width="18.800" height="13.800" rx="2.600" fill={u("lilac")} />
            <path d="M12 7.200C10.300 5.900 7.800 5.400 4.600 5.800v11c3.200-.4 5.700.1 7.400 1.400z" fill={u("page")} />
            <path d="M12 7.200c1.700-1.300 4.200-1.800 7.400-1.400v11c-3.200-.4-5.700.1-7.400 1.400z" fill={u("page")} />
            <path d="M12 7.200v11.200" stroke={PAINT.lilac[1]} strokeWidth="0.800" opacity="0.6" />
            <path d="M6.500 9.300c1.100-.1 2.200 0 3.200.4M6.500 12c1.100-.1 2.200 0 3.200.4M14.300 9.700c1-.4 2.100-.5 3.200-.4M14.300 12.400c1-.4 2.100-.5 3.200-.4" fill="none" stroke={PAINT.lilac[1]} strokeWidth="1.100" strokeLinecap="round" opacity="0.7" />
          </>
        ),
      };
    case "letters":
      return {
        paints: ["mint"],
        art: (
          <>
            <rect x="3.500" y="4.300" width="17" height="17" rx="5" fill={PAINT.mint[3]} />
            <rect x="3.500" y="3.300" width="17" height="17" rx="5" fill={u("mint")} />
            <path d="M8.700 16.300 12 7.700l3.300 8.600M9.900 13.400h4.200" fill="none" stroke="#fff" strokeWidth="2.100" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="8" cy="6.300" rx="2.400" ry="1" transform="rotate(-20 8 6.300)" fill="#fff" opacity="0.4" />
          </>
        ),
      };
    case "bolt":
      return { paints: ["gold"], art: <Soft d={BOLT} paint="gold" u={u} round={2} /> };
    case "plus":
      return { paints: ["orange"], art: <><Soft d={PLUS} paint="orange" u={u} round={2.2} /><ellipse cx="11.300" cy="6" rx="1.400" ry="0.800" fill="#fff" opacity="0.45" /></> };
    case "wand":
      return {
        paints: ["lilac", "pink", "gold"],
        art: (
          <>
            <path d="M5 20.300l7.600-7.600" fill="none" stroke={PAINT.lilac[3]} strokeWidth="2.800" strokeLinecap="round" />
            <path d="M5 19.500l7.600-7.600" fill="none" stroke={PAINT.lilac[1]} strokeWidth="2.800" strokeLinecap="round" />
            <Soft d={STAR} paint="pink" u={u} transform="translate(8.200 0.200) scale(0.660)" round={2.4} />
            <circle cx="6" cy="6.500" r="1.500" fill={u("gold")} />
            <circle cx="19.500" cy="17.500" r="1.300" fill={u("gold")} />
            <circle cx="10" cy="3.800" r="0.800" fill={u("gold")} />
          </>
        ),
      };
    case "play":
      return { paints: [], art: <path d="M8 5.200v13.600a1 1 0 0 0 1.500.9l11-6.800a1 1 0 0 0 0-1.700l-11-6.800A1 1 0 0 0 8 5.200z" fill="currentColor" /> };
    case "backspace":
      return { paints: [], art: <path d="M9 5.500h10.500A1.500 1.500 0 0 1 21 7v10a1.500 1.500 0 0 1-1.500 1.500H9L3 12zM11.500 9.500l5 5M16.500 9.500l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> };
    case "check":
      return { paints: [], art: <path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" /> };
  }
}

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  const id = useId();
  const { paints, art } = draw(name, (p) => `url(#${id}-${p})`);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      // A soft shadow lifts the coloured icons off pastel tiles; it scales with the icon.
      style={paints.length ? { filter: `drop-shadow(0 ${(size * 0.07).toFixed(2)}px ${(size * 0.09).toFixed(2)}px rgba(27,20,51,0.22))` } : undefined}
    >
      {paints.length ? (
        <defs>
          {paints.map((p) => (
            <radialGradient key={p} id={`${id}-${p}`} cx="0.32" cy="0.24" r="0.9">
              <stop offset="0" stopColor={PAINT[p][0]} />
              <stop offset="0.5" stopColor={PAINT[p][1]} />
              <stop offset="1" stopColor={PAINT[p][2]} />
            </radialGradient>
          ))}
        </defs>
      ) : null}
      {art}
    </svg>
  );
}
