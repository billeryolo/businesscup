"use client";

// Animal avatars drawn in code with a soft, clay-like look: every part is shaded from a light at
// the top left, with soft shadows, blush and a highlight. Being SVG they can still move: they
// breathe, blink at random moments, glance at a tap, and react (cheer, wave hello, a gentle
// "oops"). The full-body version lives in ./buddy.tsx.

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { type RefObject, useEffect, useId, useRef, useState } from "react";
import type { AnimalId } from "@/lib/store/family";

/**
 * idle: calm. happy: smiling. cheer: bouncing for a right answer. oops: a soft "oh!" for a wrong
 * answer (never sad). wave: a friendly hello with a paw.
 */
export type Mood = "idle" | "happy" | "cheer" | "oops" | "wave";

/** Three tones from lit to shaded. */
type Tones = [string, string, string];
export type Look = {
  fur: Tones;
  /** Mane, inner ears, tail tuft. */
  accent: Tones;
  cream: [string, string];
  /** Colour of the soft shadows one part drops on another. */
  shadow: string;
  nose: string;
  ears: "round" | "big" | "long" | "pointy" | "mane" | "side";
};

const INK = "#5A3A32";

export const LOOKS: Record<AnimalId, Look> = {
  lion: { fur: ["#FFF1C4", "#FFDA8C", "#EEB15C"], accent: ["#FFC79A", "#F7A56C", "#E2854E"], cream: ["#FFFDF6", "#FBE5C0"], shadow: "#A8541C", nose: "#8A4B3A", ears: "mane" },
  koala: { fur: ["#F6F7FB", "#D3D8E6", "#A9B0C6"], accent: ["#FFE1EA", "#F8BFD0", "#E79DB4"], cream: ["#FFFFFF", "#ECEFF6"], shadow: "#6F7690", nose: "#4E4A60", ears: "big" },
  monkey: { fur: ["#E2B48C", "#C08A60", "#9A6743"], accent: ["#E2B48C", "#C08A60", "#9A6743"], cream: ["#FFF6E8", "#F7DDBB"], shadow: "#6E4226", nose: "#7A4A36", ears: "side" },
  bear: { fur: ["#F8DDB8", "#E3B07C", "#C58A55"], accent: ["#FBE9CF", "#F2CFA0", "#DDAE78"], cream: ["#FFFBF2", "#F8E3C4"], shadow: "#8C5A2E", nose: "#7A4A36", ears: "round" },
  bunny: { fur: ["#FFFAFC", "#F9E1EA", "#E4B9CA"], accent: ["#FFD9E6", "#F9B7CE", "#EC97B5"], cream: ["#FFFFFF", "#FBEFF4"], shadow: "#B58A9C", nose: "#E98BA6", ears: "long" },
  fox: { fur: ["#FFD3AB", "#F9A468", "#E37E40"], accent: ["#8A5A44", "#6E4332", "#573325"], cream: ["#FFFFFF", "#FDEBDA"], shadow: "#A24E1C", nose: "#6B3F33", ears: "pointy" },
};

/** Gradients and blurs for one figure. `id` keeps them apart when several avatars share a page. */
export function SoftDefs({ id, look, bodyLight }: { id: string; look: Look; bodyLight?: { cx: number; cy: number; r: number } }) {
  const stops = (tones: readonly string[]) => tones.map((color, i) => <stop key={i} offset={tones.length === 3 ? [0, 0.5, 1][i] : i} stopColor={color} />);
  return (
    <defs>
      {/* Light comes from the top left: every part is pale there and deeper at the bottom right. */}
      <radialGradient id={`${id}-fur`} cx="0.36" cy="0.28" r="0.85">
        {stops(look.fur)}
      </radialGradient>
      <radialGradient id={`${id}-acc`} cx="0.36" cy="0.3" r="0.8">
        {stops(look.accent)}
      </radialGradient>
      <radialGradient id={`${id}-cream`} cx="0.4" cy="0.3" r="0.8">
        {stops(look.cream)}
      </radialGradient>
      <radialGradient id={`${id}-eye`} cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#5A4347" />
        <stop offset="1" stopColor="#2E2024" />
      </radialGradient>
      {/* One gradient across the body, arms and feet, in drawing units, so they shade as one piece. */}
      {bodyLight ? (
        <radialGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" {...bodyLight}>
          {stops(look.fur)}
        </radialGradient>
      ) : null}
      <clipPath id={`${id}-face`}>
        <ellipse cx="50" cy="54" rx="33" ry="30.8" />
      </clipPath>
      <filter id={`${id}-blur1`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.3" />
      </filter>
      <filter id={`${id}-blur3`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}

function Ears({ look, u }: { look: Look; u: (name: string) => string }) {
  const fur = u("fur");
  switch (look.ears) {
    case "side":
      // Monkey: ears stick out at eye level with a light inside, plus a little tuft of hair on top.
      return (
        <>
          <circle cx="13" cy="54" r="11.5" fill={fur} />
          <circle cx="87" cy="54" r="11.5" fill={fur} />
          <circle cx="13.5" cy="54" r="6.5" fill={u("cream")} />
          <circle cx="86.5" cy="54" r="6.5" fill={u("cream")} />
          <path d="M40 27 C38 15 45 11 49 17 C50 9 57 9 57 17 C62 12 66 18 60 28 Z" fill={fur} />
        </>
      );
    case "mane":
      // A ring of soft blobs, each with its own light, and small round ears on top.
      return (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 + 0.26;
            return <circle key={i} cx={Math.round((50 + Math.cos(a) * 32.5) * 10) / 10} cy={Math.round((52 + Math.sin(a) * 31.4) * 10) / 10} r="12.9" fill={u("acc")} />;
          })}
          <circle cx="50" cy="52" r="33.6" fill={look.accent[1]} />
          <circle cx="24.200" cy="22.600" r="9.500" fill={fur} />
          <circle cx="75.800" cy="22.600" r="9.500" fill={fur} />
          <circle cx="24.800" cy="23.700" r="5.200" fill="#F7A98A" />
          <circle cx="75.200" cy="23.700" r="5.200" fill="#F7A98A" />
        </>
      );
    case "big":
      return (
        <>
          <circle cx="17" cy="34" r="16.500" fill={fur} />
          <circle cx="83" cy="34" r="16.500" fill={fur} />
          <circle cx="17.500" cy="35" r="9.500" fill={u("acc")} />
          <circle cx="82.500" cy="35" r="9.500" fill={u("acc")} />
        </>
      );
    case "long":
      return (
        <>
          <ellipse cx="34" cy="18" rx="9.500" ry="21" fill={fur} />
          <ellipse cx="66" cy="18" rx="9.500" ry="21" fill={fur} />
          <ellipse cx="34.300" cy="20" rx="4.600" ry="14.500" fill={u("acc")} />
          <ellipse cx="65.700" cy="20" rx="4.600" ry="14.500" fill={u("acc")} />
        </>
      );
    case "pointy":
      return (
        <g strokeLinejoin="round" strokeWidth="5">
          <path d="M20 40 L23 11 L43 27 Z" fill={fur} stroke={look.fur[1]} />
          <path d="M80 40 L77 11 L57 27 Z" fill={fur} stroke={look.fur[1]} />
          <path d="M26 31 L27 18 L36 26 Z" fill={look.accent[1]} stroke={look.accent[1]} strokeWidth="2" />
          <path d="M74 31 L73 18 L64 26 Z" fill={look.accent[1]} stroke={look.accent[1]} strokeWidth="2" />
        </g>
      );
    default:
      return (
        <>
          <circle cx="22" cy="28" r="12.500" fill={fur} />
          <circle cx="78" cy="28" r="12.500" fill={fur} />
          <circle cx="22.500" cy="29" r="6.800" fill={u("acc")} />
          <circle cx="77.500" cy="29" r="6.800" fill={u("acc")} />
        </>
      );
  }
}

/**
 * Blinks every second or two, at slightly random moments so a row of avatars doesn't blink in
 * unison. About one blink in four is a quick double.
 */
export function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const blink = (again: boolean) => {
      setClosed(true);
      timer = setTimeout(() => {
        setClosed(false);
        if (again) timer = setTimeout(() => blink(false), 130);
        else schedule();
      }, 130);
    };
    const schedule = () => {
      timer = setTimeout(() => blink(Math.random() < 0.25), 1100 + Math.random() * 1700);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [enabled]);
  return closed;
}

/**
 * One pointer listener for every avatar on the page. Avatars subscribe while mounted; a tap or a
 * pointer move tells them where to look, and a moment later (null) they look ahead again.
 */
type Point = { x: number; y: number };
type Watcher = (point: Point | null) => void;
const pointer = { watchers: new Set<Watcher>(), last: null as Point | null, frame: 0, rest: undefined as ReturnType<typeof setTimeout> | undefined };

function onPointer(event: PointerEvent) {
  pointer.last = { x: event.clientX, y: event.clientY };
  if (!pointer.frame) {
    pointer.frame = requestAnimationFrame(() => {
      pointer.frame = 0;
      pointer.watchers.forEach((watch) => watch(pointer.last));
    });
  }
  clearTimeout(pointer.rest);
  pointer.rest = setTimeout(() => pointer.watchers.forEach((watch) => watch(null)), 1300);
}

function watchPointer(watch: Watcher) {
  if (!pointer.watchers.size) {
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
  }
  pointer.watchers.add(watch);
  return () => {
    pointer.watchers.delete(watch);
    if (pointer.watchers.size) return;
    window.removeEventListener("pointerdown", onPointer);
    window.removeEventListener("pointermove", onPointer);
    cancelAnimationFrame(pointer.frame);
    clearTimeout(pointer.rest);
    pointer.frame = 0;
  };
}

/**
 * Eyes glance toward a nearby tap or pointer, then ease back. It moves motion values, not React
 * state, so nothing re-renders. Takes a ref to the eyes and returns the offsets, in SVG units.
 */
export function useLook(ref: RefObject<SVGGElement | null>, enabled: boolean) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 220, damping: 20 });
  const y = useSpring(targetY, { stiffness: 220, damping: 20 });
  // The sparkle travels a little further than the eye, which reads as the eye turning.
  const shineX = useTransform(x, (v) => v * 0.35);
  const shineY = useTransform(y, (v) => v * 0.35);

  useEffect(() => {
    if (!enabled) return;
    const stop = watchPointer((point) => {
      const box = ref.current?.getBoundingClientRect();
      if (!point || !box || !box.width) {
        targetX.set(0);
        targetY.set(0);
        return;
      }
      const unit = box.width / 38; // the pair of eyes is about 38 SVG units wide
      const dx = point.x - (box.left + box.width / 2);
      const dy = point.y - (box.top + box.height / 2);
      const far = Math.hypot(dx, dy);
      // Only taps that are near: within about two and a half heads, and at least 200px.
      if (far < 1 || far > Math.max(200, unit * 250)) {
        targetX.set(0);
        targetY.set(0);
        return;
      }
      const pull = Math.min(1, far / (unit * 50));
      targetX.set((dx / far) * pull * 2.4);
      targetY.set((dy / far) * pull * 1.5);
    });
    return () => {
      stop();
      targetX.set(0);
      targetY.set(0);
    };
  }, [ref, enabled, targetX, targetY]);

  return { x, y, shineX, shineY };
}

/** A motion style that rotates or scales an SVG group around a point given in viewBox units. */
export function pivot(x: number, y: number) {
  // motion builds transform-origin itself from originX/originY and ignores a plain transformOrigin.
  return { transformBox: "view-box", originX: `${x}px`, originY: `${y}px` } as const;
}


/** The head, in a 100 x 100 box. Shared by the head-only avatar and the full-body buddy. */
export function AnimalHead({ id, look, mood, still, follow }: { id: string; look: Look; mood: Mood; still: boolean; follow: boolean }) {
  const blinking = useBlink(!still);
  const eyes = useRef<SVGGElement>(null);
  const gaze = useLook(eyes, follow && !still);
  const u = (name: string) => `url(#${id}-${name})`;
  const oops = mood === "oops";
  const smiling = mood !== "idle" && !oops;
  const koala = look.ears === "big";
  // The koala's big nose pushes its mouth down a little.
  const mouthDrop = koala ? 2.6 : 0;

  return (
    <>
      <Ears look={look} u={u} />
      {/* the face's shadow on what is behind it, then the face */}
      <ellipse cx="51" cy="56" rx="33.6" ry="31.4" fill={look.shadow} opacity="0.3" filter={u("blur1")} />
      <ellipse cx="50" cy="54" rx="33" ry="30.8" fill={u("fur")} />

      {/* light patches */}
      {look.ears === "side" ? (
        <>
          <circle cx="36.500" cy="53" r="15" fill={u("cream")} />
          <circle cx="63.500" cy="53" r="15" fill={u("cream")} />
          <ellipse cx="50" cy="68" rx="19" ry="12.500" fill={u("cream")} />
        </>
      ) : look.ears === "pointy" ? (
        <g clipPath={u("face")}>
          <ellipse cx="29" cy="72" rx="20" ry="15" fill={u("cream")} />
          <ellipse cx="71" cy="72" rx="20" ry="15" fill={u("cream")} />
          <ellipse cx="50" cy="68" rx="13" ry="10" fill={u("cream")} />
        </g>
      ) : (
        <ellipse cx="50" cy={66.3 + mouthDrop / 2} rx="12.900" ry={9.5 + mouthDrop / 2} fill={u("cream")} />
      )}

      {/* soft highlight */}
      <ellipse cx="35.500" cy="36" rx="13.500" ry="6.700" transform="rotate(-24 35.500 36)" fill="#fff" opacity="0.5" filter={u("blur3")} />

      {/* cheeks */}
      <ellipse cx="26.500" cy="64" rx="7.300" ry="4.800" fill="#FF9A9A" opacity="0.6" filter={u("blur1")} />
      <ellipse cx="73.500" cy="64" rx="7.300" ry="4.800" fill="#FF9A9A" opacity="0.6" filter={u("blur1")} />

      {/* brows only for "oops": lifted in the middle, a puzzled "oh!" rather than a sad face */}
      {oops ? (
        <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.8">
          <path d="M29.300 46.700 Q33.800 43.900 38.800 44.600" />
          <path d="M70.700 46.700 Q66.200 43.900 61.200 44.600" />
        </g>
      ) : null}

      {/* eyes: small, glossy and wide apart; scaleY squashes them only for a blink */}
      <g ref={eyes} style={{ transformOrigin: "50px 55px", transform: `scaleY(${blinking ? 0.1 : 1})`, transition: "transform 90ms ease-out" }}>
        <motion.g style={{ x: gaze.x, y: gaze.y }}>
          <ellipse cx="34.300" cy="55.100" rx="4.100" ry="4.700" fill={u("eye")} />
          <ellipse cx="65.700" cy="55.100" rx="4.100" ry="4.700" fill={u("eye")} />
          <motion.g style={{ x: gaze.shineX, y: gaze.shineY }} fill="#fff">
            <circle cx="35.600" cy="53.400" r={smiling ? 1.7 : 1.35} />
            <circle cx="67" cy="53.400" r={smiling ? 1.7 : 1.35} />
          </motion.g>
        </motion.g>
      </g>

      {/* nose and mouth */}
      {koala ? <ellipse cx="50" cy="62" rx="5.200" ry="6" fill={look.nose} /> : <ellipse cx="50" cy="61.600" rx="3.800" ry="2.700" fill={look.nose} />}
      <ellipse cx="49" cy={koala ? 59.4 : 60.8} rx="1.400" ry="0.700" fill="#fff" opacity="0.5" />
      <g transform={`translate(0 ${mouthDrop})`}>
        {oops ? (
          <ellipse cx="50" cy="69.300" rx="2.600" ry="3" fill="#E8707F" stroke={INK} strokeWidth="1.700" />
        ) : (
          <path d={smiling ? "M44.400 66.100 Q50 74.700 55.600 66.100 Z" : "M45.500 66.500 Q50 70.600 54.500 66.500"} fill={smiling ? "#E8707F" : "none"} stroke={INK} strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </>
  );
}

/** A paw that pops up beside the head to wave hello. */
function WavingPaw({ look, u, still }: { look: Look; u: (name: string) => string; still: boolean }) {
  return (
    <motion.g
      style={pivot(86, 100)}
      animate={still ? undefined : { rotate: [-12, 14, -12, 14, -12], transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" } }}
    >
      <ellipse cx="86" cy="82" rx="9.500" ry="10" fill={look.shadow} opacity="0.3" filter={u("blur1")} />
      <path d="M86 100 L85.500 88" stroke={look.fur[1]} strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="85" cy="79" rx="8.500" ry="9.500" fill={u("fur")} />
      <ellipse cx="85" cy="81.500" rx="4.200" ry="3.400" fill={u("cream")} />
      <circle cx="80.600" cy="75.600" r="1.500" fill={look.cream[1]} />
      <circle cx="85" cy="73.600" r="1.500" fill={look.cream[1]} />
      <circle cx="89.400" cy="75.600" r="1.500" fill={look.cream[1]} />
    </motion.g>
  );
}

/**
 * The head-only avatar. `follow` (on by default) lets the eyes glance at nearby taps; all avatars
 * share one window listener, so it is cheap. Pass `follow={false}` to switch it off.
 */
export function AnimalAvatar({ animal, size = 64, mood = "idle", follow = true, className }: { animal: AnimalId; size?: number; mood?: Mood; follow?: boolean; className?: string }) {
  const id = useId();
  const look = LOOKS[animal];
  const still = useReducedMotion() ?? false;
  const u = (name: string) => `url(#${id}-${name})`;

  const body =
    still
      ? {}
      : mood === "cheer"
        ? { y: [0, -10, 0, -6, 0], rotate: [0, -6, 6, -3, 0], transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.6 } }
        : mood === "oops"
          ? // a quick little head shake, then a small droop; it plays once
            { y: [0, 0, 1, 2, 2.5, 2.5], rotate: [0, -7, 6, -4, 3, 0], transition: { duration: 0.5 } }
          : mood === "wave"
            ? { y: [0, -2.5, 0], rotate: [0, 5, 0], transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const } }
            : { y: [0, -2.5, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const } };

  return (
    <motion.svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={animal} animate={body} style={{ overflow: "visible" }}>
      <SoftDefs id={id} look={look} />
      <AnimalHead id={id} look={look} mood={mood} still={still} follow={follow} />
      {mood === "wave" ? <WavingPaw look={look} u={u} still={still} /> : null}
    </motion.svg>
  );
}

/** The avatar inside a white bubble, as on the kid screens. */
export function AvatarBubble({ animal, size = 64, mood, selected, follow }: { animal: AnimalId; size?: number; mood?: Mood; selected?: boolean; follow?: boolean }) {
  return (
    <span
      className={`grid place-items-center rounded-full bg-white shadow-[0_6px_16px_rgba(27,20,51,0.12)] transition-shadow ${selected ? "ring-[3px] ring-night" : ""}`}
      style={{ width: size, height: size }}
    >
      <AnimalAvatar animal={animal} size={size * 0.78} mood={mood} follow={follow} />
    </span>
  );
}
