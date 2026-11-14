"use client";

// Animal avatars drawn in code, so they can move: they breathe, blink at random moments, and can
// cheer. One SVG per animal, all sharing the same face so they read as one family.

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { AnimalId } from "@/lib/store/family";

export type Mood = "idle" | "happy" | "cheer";

type Look = { fur: string; furDark: string; muzzle: string; cheek: string; ears: "round" | "big" | "long" | "pointy" | "mane" };

const LOOKS: Record<AnimalId, Look> = {
  lion: { fur: "#F6B13A", furDark: "#E8862B", muzzle: "#FFE7B8", cheek: "#F58A6B", ears: "mane" },
  koala: { fur: "#B9BECC", furDark: "#8F96A8", muzzle: "#EEF0F5", cheek: "#F5A8B8", ears: "big" },
  monkey: { fur: "#B9743F", furDark: "#8E5429", muzzle: "#F6D2A8", cheek: "#F08C6E", ears: "round" },
  bear: { fur: "#C98B56", furDark: "#A56A3A", muzzle: "#F4DDBF", cheek: "#F29B7C", ears: "round" },
  bunny: { fur: "#F7F1F4", furDark: "#F3B9CF", muzzle: "#FFFFFF", cheek: "#F7A6C2", ears: "long" },
  fox: { fur: "#F2803A", furDark: "#C9571C", muzzle: "#FFF3E4", cheek: "#F6A07A", ears: "pointy" },
};

function Ears({ look }: { look: Look }) {
  const { fur, furDark, ears } = look;
  switch (ears) {
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

/** Blinks at slightly random intervals so a row of avatars doesn't blink in unison. */
function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setClosed(true);
          timer = setTimeout(() => {
            setClosed(false);
            schedule();
          }, 140);
        },
        2200 + Math.random() * 2600,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [enabled]);
  return closed;
}

export function AnimalAvatar({ animal, size = 64, mood = "idle", className }: { animal: AnimalId; size?: number; mood?: Mood; className?: string }) {
  const look = LOOKS[animal];
  const still = useReducedMotion() ?? false;
  const blinking = useBlink(!still);
  const smiling = mood !== "idle";

  const body =
    still
      ? {}
      : mood === "cheer"
        ? { y: [0, -10, 0, -6, 0], rotate: [0, -6, 6, -3, 0], transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.6 } }
        : { y: [0, -2.5, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const } };

  return (
    <motion.svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={animal} animate={body}>
      <Ears look={look} />
      <circle cx="50" cy="54" r="34" fill={look.fur} />
      {/* muzzle */}
      <ellipse cx="50" cy="66" rx="17" ry="13" fill={look.muzzle} />
      {/* cheeks */}
      <circle cx="26" cy="62" r="6" fill={look.cheek} opacity="0.75" />
      <circle cx="74" cy="62" r="6" fill={look.cheek} opacity="0.75" />
      {/* eyes: scaleY squashes them for a blink or a happy squint */}
      <g style={{ transformOrigin: "50px 50px", transform: `scaleY(${blinking ? 0.1 : smiling ? 0.55 : 1})`, transition: "transform 90ms ease-out" }}>
        <circle cx="37" cy="50" r="5.2" fill="#2A1F3D" />
        <circle cx="63" cy="50" r="5.2" fill="#2A1F3D" />
        <circle cx="38.8" cy="48.2" r="1.7" fill="#fff" />
        <circle cx="64.8" cy="48.2" r="1.7" fill="#fff" />
      </g>
      {/* nose and mouth */}
      <ellipse cx="50" cy="61" rx="4.6" ry="3.4" fill="#2A1F3D" />
      <path
        d={smiling ? "M41 67 Q50 79 59 67" : "M43 68 Q50 74 57 68"}
        fill={smiling ? "#E4556B" : "none"}
        stroke="#2A1F3D"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

/** The avatar inside a white bubble, as on the kid screens. */
export function AvatarBubble({ animal, size = 64, mood, selected }: { animal: AnimalId; size?: number; mood?: Mood; selected?: boolean }) {
  return (
    <span
      className={`grid place-items-center rounded-full bg-white shadow-[0_6px_16px_rgba(27,20,51,0.12)] transition-shadow ${selected ? "ring-[3px] ring-night" : ""}`}
      style={{ width: size, height: size }}
    >
      <AnimalAvatar animal={animal} size={size * 0.78} mood={mood} />
    </span>
  );
}
