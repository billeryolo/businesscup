"use client";

// Animal avatars drawn in code, so they can move: they breathe, blink at random moments, glance at
// a tap, and react (cheer, wave hello, a gentle "oops"). One SVG per animal, all sharing the same
// face so they read as one family. The full-body version lives in ./buddy.tsx.

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { AnimalId } from "@/lib/store/family";

/**
 * idle: calm. happy: smiling. cheer: bouncing for a right answer. oops: a soft "oh!" for a wrong
 * answer (never sad). wave: a friendly hello with a paw.
 */
export type Mood = "idle" | "happy" | "cheer" | "oops" | "wave";

/** `shade` is a slightly darker fur, used to outline paws and limbs that sit on top of fur. */
export type Look = { fur: string; furDark: string; shade: string; muzzle: string; cheek: string; ears: "round" | "big" | "long" | "pointy" | "mane" | "side" };

const INK = "#2A1F3D";

export const LOOKS: Record<AnimalId, Look> = {
  lion: { fur: "#F6B13A", furDark: "#E8862B", shade: "#DE9524", muzzle: "#FFE7B8", cheek: "#F58A6B", ears: "mane" },
  koala: { fur: "#B9BECC", furDark: "#8F96A8", shade: "#9EA4B5", muzzle: "#EEF0F5", cheek: "#F5A8B8", ears: "big" },
  monkey: { fur: "#8A5638", furDark: "#6B3F27", shade: "#6E4129", muzzle: "#F9D9B4", cheek: "#F08C6E", ears: "side" },
  bear: { fur: "#C98B56", furDark: "#A56A3A", shade: "#B17643", muzzle: "#F4DDBF", cheek: "#F29B7C", ears: "round" },
  bunny: { fur: "#F7F1F4", furDark: "#F3B9CF", shade: "#E3D5DC", muzzle: "#FFFFFF", cheek: "#F7A6C2", ears: "long" },
  fox: { fur: "#F2803A", furDark: "#C9571C", shade: "#D9682A", muzzle: "#FFF3E4", cheek: "#F6A07A", ears: "pointy" },
};

function Ears({ look }: { look: Look }) {
  const { fur, furDark, muzzle, ears } = look;
  switch (ears) {
    case "side":
      // Monkey: ears stick out at eye level with a light inside, plus a little tuft of hair on top.
      return (
        <>
          <circle cx="13" cy="52" r="11" fill={fur} />
          <circle cx="87" cy="52" r="11" fill={fur} />
          <circle cx="13.5" cy="52" r="6.5" fill={muzzle} />
          <circle cx="86.5" cy="52" r="6.5" fill={muzzle} />
          <path d="M41 26 C39 15 45 11 49 17 C50 9 57 9 57 17 C61 12 65 18 60 27 Z" fill={fur} />
        </>
      );
    case "mane":
      return (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.round(50 + Math.cos(a) * 31)} cy={Math.round(52 + Math.sin(a) * 31)} r="11" fill={furDark} />;
          })}
        </>
      );
    case "big":
      return (
        <>
          <circle cx="19" cy="35" r="16" fill={fur} />
          <circle cx="81" cy="35" r="16" fill={fur} />
          <circle cx="19" cy="35" r="9" fill={furDark} />
          <circle cx="81" cy="35" r="9" fill={furDark} />
        </>
      );
    case "long":
      return (
        <>
          <ellipse cx="34" cy="16" rx="9" ry="22" fill={fur} />
          <ellipse cx="66" cy="16" rx="9" ry="22" fill={fur} />
          <ellipse cx="34" cy="18" rx="4.5" ry="15" fill={furDark} />
          <ellipse cx="66" cy="18" rx="4.5" ry="15" fill={furDark} />
        </>
      );
    case "pointy":
      return (
        <>
          <path d="M18 40 L22 8 L44 26 Z" fill={fur} />
          <path d="M82 40 L78 8 L56 26 Z" fill={fur} />
          <path d="M24 32 L25 16 L36 26 Z" fill={furDark} />
          <path d="M76 32 L75 16 L64 26 Z" fill={furDark} />
        </>
      );
    default:
      return (
        <>
          <circle cx="22" cy="30" r="12" fill={fur} />
          <circle cx="78" cy="30" r="12" fill={fur} />
          <circle cx="22" cy="30" r="6.5" fill={furDark} />
          <circle cx="78" cy="30" r="6.5" fill={furDark} />
        </>
      );
  }
}

/**
 * Blinks every second or two, at slightly random moments so a row of avatars doesn't blink in
 * unison. About one blink in four is a quick double.
 */
function useBlink(enabled: boolean) {
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
function useLook(ref: RefObject<SVGGElement | null>, enabled: boolean) {
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
export function AnimalHead({ look, mood, still, follow }: { look: Look; mood: Mood; still: boolean; follow: boolean }) {
  const blinking = useBlink(!still);
  const eyes = useRef<SVGGElement>(null);
  const gaze = useLook(eyes, follow && !still);
  const oops = mood === "oops";
  const smiling = mood !== "idle" && !oops;
  const monkey = look.ears === "side";

  return (
    <>
      <Ears look={look} />
      <circle cx="50" cy="54" r="34" fill={look.fur} />
      {monkey ? (
        // A light heart-shaped face: a patch around each eye that runs into the muzzle.
        <>
          <circle cx="36.5" cy="50" r="15.5" fill={look.muzzle} />
          <circle cx="63.5" cy="50" r="15.5" fill={look.muzzle} />
          <ellipse cx="50" cy="67" rx="20" ry="14" fill={look.muzzle} />
        </>
      ) : (
        <ellipse cx="50" cy="66" rx="17" ry="13" fill={look.muzzle} />
      )}
      {/* cheeks */}
      <circle cx={monkey ? 31 : 26} cy={monkey ? 59.5 : 62} r={monkey ? 4.3 : 6} fill={look.cheek} opacity="0.75" />
      <circle cx={monkey ? 69 : 74} cy={monkey ? 59.5 : 62} r={monkey ? 4.3 : 6} fill={look.cheek} opacity="0.75" />
      {/* brows only for "oops": lifted in the middle, a puzzled "oh!" rather than a sad face */}
      {oops ? (
        <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.85">
          <path d="M31 41.5 Q36 38.6 41.5 39" />
          <path d="M69 41.5 Q64 38.6 58.5 39" />
        </g>
      ) : null}
      {/* eyes: round and wide open, with a bigger sparkle when happy; scaleY squashes them only for a blink */}
      <g ref={eyes} style={{ transformOrigin: "50px 50px", transform: `scaleY(${blinking ? 0.1 : 1})`, transition: "transform 90ms ease-out" }}>
        <motion.g style={{ x: gaze.x, y: gaze.y }}>
          <circle cx="37" cy="50" r={smiling ? 5.8 : 5.2} fill={INK} />
          <circle cx="63" cy="50" r={smiling ? 5.8 : 5.2} fill={INK} />
          <motion.g style={{ x: gaze.shineX, y: gaze.shineY }}>
            <circle cx="38.8" cy="48.2" r={smiling ? 2.2 : 1.7} fill="#fff" />
            <circle cx="64.8" cy="48.2" r={smiling ? 2.2 : 1.7} fill="#fff" />
            {smiling ? (
              <>
                <circle cx="35.4" cy="52.4" r="0.9" fill="#fff" />
                <circle cx="61.4" cy="52.4" r="0.9" fill="#fff" />
              </>
            ) : null}
          </motion.g>
        </motion.g>
      </g>
      {/* nose and mouth */}
      <ellipse cx="50" cy="61" rx="4.6" ry="3.4" fill={INK} />
      {oops ? (
        <ellipse cx="50" cy="70.6" rx="3.3" ry="3.7" fill="#E4556B" stroke={INK} strokeWidth="2.2" />
      ) : (
        <path
          d={smiling ? "M41 67 Q50 79 59 67" : "M43 68 Q50 74 57 68"}
          fill={smiling ? "#E4556B" : "none"}
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </>
  );
}

/** A paw that pops up beside the head to wave hello. */
function WavingPaw({ look, still }: { look: Look; still: boolean }) {
  return (
    <motion.g
      style={pivot(86, 100)}
      animate={still ? undefined : { rotate: [-12, 14, -12, 14, -12], transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" } }}
    >
      <path d="M86 100 L85.5 88" stroke={look.shade} strokeWidth="11.5" strokeLinecap="round" />
      <path d="M86 100 L85.5 88" stroke={look.fur} strokeWidth="8.5" strokeLinecap="round" />
      <ellipse cx="85" cy="79" rx="8.5" ry="9.5" fill={look.fur} stroke={look.shade} strokeWidth="1.5" />
      <ellipse cx="85" cy="81.5" rx="4.2" ry="3.4" fill={look.muzzle} />
      <circle cx="80.6" cy="75.6" r="1.5" fill={look.muzzle} />
      <circle cx="85" cy="73.6" r="1.5" fill={look.muzzle} />
      <circle cx="89.4" cy="75.6" r="1.5" fill={look.muzzle} />
    </motion.g>
  );
}

/**
 * The head-only avatar. `follow` (on by default) lets the eyes glance at nearby taps; all avatars
 * share one window listener, so it is cheap. Pass `follow={false}` to switch it off.
 */
export function AnimalAvatar({ animal, size = 64, mood = "idle", follow = true, className }: { animal: AnimalId; size?: number; mood?: Mood; follow?: boolean; className?: string }) {
  const look = LOOKS[animal];
  const still = useReducedMotion() ?? false;

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
    <motion.svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={animal} animate={body}>
      <AnimalHead look={look} mood={mood} still={still} follow={follow} />
      {mood === "wave" ? <WavingPaw look={look} still={still} /> : null}
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
