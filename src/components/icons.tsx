// The app's own icons, drawn here so nothing depends on the phone's emoji font. Coloured ones
// share the avatars' dark outline; play, back and check take the text colour.

export type IconName = "star" | "flame" | "book" | "letters" | "bolt" | "plus" | "wand" | "play" | "backspace" | "check";

const INK = "#2A1F3D";
const STAR = "M12 2.6l2.7 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.6 6.3 19.8l1.4-6.3L2.9 9.2l6.4-.7z";
const outline = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: "round", strokeLinecap: "round" } as const;

const DRAW: Record<IconName, React.ReactNode> = {
  star: <path d={STAR} fill="#FFC83D" {...outline} />,
  flame: (
    <>
      <path d="M12 2.500c.6 3.200 5.500 5.600 5.500 11a5.500 5.500 0 0 1-11 0c0-2 .9-3.400 2-4.500.3 1.300 1 2 1.800 2.300C10 8.200 10.500 5 12 2.500z" fill="#FF7A3D" {...outline} />
      <path d="M12 13c1.300 1.300 2.200 2.300 2.200 3.800a2.200 2.200 0 0 1-4.400 0c0-1.500.9-2.500 2.200-3.800z" fill="#FFD35A" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.500C10 5 7 4.500 3.500 5v13c3.500-.5 6.500 0 8.500 1.500z" fill="#fff" {...outline} />
      <path d="M12 6.500c2-1.500 5-2 8.500-1.500v13c-3.500-.5-6.500 0-8.500 1.500z" fill="#DCD6FF" {...outline} />
      <path d="M6 9.200c1.300-.1 2.500 0 3.600.4M6 12.400c1.300-.1 2.500 0 3.600.4M14.400 9.600c1.100-.4 2.300-.5 3.600-.4M14.400 12.800c1.100-.4 2.300-.5 3.600-.4" fill="none" stroke={INK} strokeWidth="1.200" strokeLinecap="round" opacity="0.55" />
    </>
  ),
  letters: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#3FBF8A" {...outline} />
      <path d="M8.500 16.500 12 7.500l3.500 9M9.800 13.500h4.400" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bolt: <path d="M13.500 2.500 5 13.500h5.500l-1 8L19 10h-5.800z" fill="#FFD23F" {...outline} />,
  plus: <path d="M9.500 3.500h5v6h6v5h-6v6h-5v-6h-6v-5h6z" fill="#FF9A4D" {...outline} />,
  wand: (
    <>
      <path d="M4.500 19.500l8-8" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M4.500 19.500l8-8" fill="none" stroke="#B9A2FF" strokeWidth="1.800" strokeLinecap="round" />
      <path d={STAR} transform="translate(8.300 .3) scale(.64)" fill="#FF8FD8" stroke={INK} strokeWidth="2.400" strokeLinejoin="round" />
      <circle cx="6" cy="6.500" r="1.500" fill="#FFC83D" stroke={INK} strokeWidth="1.200" />
      <circle cx="19.500" cy="17.500" r="1.500" fill="#FFC83D" stroke={INK} strokeWidth="1.200" />
    </>
  ),
  play: <path d="M8 5.200v13.600a1 1 0 0 0 1.500.9l11-6.800a1 1 0 0 0 0-1.700l-11-6.800A1 1 0 0 0 8 5.200z" fill="currentColor" />,
  backspace: <path d="M9 5.500h10.500A1.500 1.500 0 0 1 21 7v10a1.500 1.500 0 0 1-1.500 1.500H9L3 12zM11.500 9.500l5 5M16.500 9.500l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  check: <path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />,
};

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      {DRAW[name]}
    </svg>
  );
}
