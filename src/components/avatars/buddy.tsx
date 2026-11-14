"use client";

// The full-body friend for kid screens: the same head as the avatar, on a small round body with
// arms, feet and (where the animal has one) a tail. It breathes, jumps to cheer, waves an arm to
// say hello, and slumps a little for "oops".

import { motion, useReducedMotion } from "motion/react";
import type { AnimalId } from "@/lib/store/family";
import { AnimalHead, LOOKS, type Look, type Mood, pivot } from "./animal";

const WIDTH = 120;
const HEIGHT = 160;
const HOP = { duration: 0.9, repeat: Infinity, repeatDelay: 0.6 };
const loop = (duration: number) => ({ duration, repeat: Infinity, ease: "easeInOut" as const });

type Wiggle = { rotate: number[]; transition: object };

function Tail({ animal, look }: { animal: AnimalId; look: Look }) {
  switch (animal) {
    case "fox":
      return (
        <g fill="none" strokeWidth="14" strokeLinecap="round">
          <path d="M78 140 Q105 142 102 115" stroke={look.fur} />
          <path d="M102.6 121 Q102.8 118 102 115" stroke={look.muzzle} />
        </g>
      );
    case "lion":
      return (
        <>
          <path d="M80 140 Q103 141 100 119" fill="none" stroke={look.fur} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="100" cy="116" r="6.5" fill={look.furDark} />
        </>
      );
    case "monkey":
      return <path d="M80 139 Q106 141 105 120 Q104 105 94 108 Q88 111 92 117" fill="none" stroke={look.fur} strokeWidth="4.5" strokeLinecap="round" />;
    case "bunny":
      return <circle cx="84" cy="138" r="7" fill={look.muzzle} stroke={look.shade} strokeWidth="1.5" />;
    case "bear":
      return <circle cx="83" cy="138" r="5.5" fill={look.furDark} />;
    default:
      return null;
  }
}

/** An arm hanging from a shoulder. `pose` is its resting angle; `wiggle` is movement on top. */
function Arm({ look, x, y, pose, wiggle, still }: { look: Look; x: number; y: number; pose: number; wiggle: Wiggle | null; still: boolean }) {
  return (
    <motion.g style={pivot(x, y)} initial={false} animate={{ rotate: pose }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }}>
      <motion.g style={pivot(x, y)} animate={wiggle ?? { rotate: 0 }}>
        <path d={`M${x} ${y} L${x} ${y + 21}`} stroke={look.shade} strokeWidth="13.5" strokeLinecap="round" />
        <path d={`M${x} ${y} L${x} ${y + 21}`} stroke={look.fur} strokeWidth="10.5" strokeLinecap="round" />
      </motion.g>
    </motion.g>
  );
}

/**
 * Full-body animal. `size` is the width; the figure is 4:3 tall (height = size * 4 / 3).
 * Moods match the head-only avatar. `follow` lets the eyes glance at nearby taps.
 */
export function AnimalBuddy({ animal, size = 120, mood = "idle", follow = true, className }: { animal: AnimalId; size?: number; mood?: Mood; follow?: boolean; className?: string }) {
  const look = LOOKS[animal];
  const still = useReducedMotion() ?? false;
  const moving = !still;
  const cheer = mood === "cheer";
  const oops = mood === "oops";
  const wave = mood === "wave";
  const settle = still ? { duration: 0 } : { duration: 0.35 };

  const figure = moving && cheer ? { y: [0, -10, 0, -6, 0], scaleY: [1, 1.04, 0.95, 1.03, 1], transition: HOP } : { y: 0, scaleY: 1, transition: settle };
  const shadow = moving && cheer ? { scaleX: [1, 0.8, 1, 0.88, 1], transition: HOP } : { scaleX: 1, transition: settle };
  const torso = oops ? { scaleY: 0.96, transition: settle } : moving ? { scaleY: [1, 1.035, 1], transition: loop(3.2) } : { scaleY: 1 };
  const tail = oops ? { rotate: 8, transition: settle } : moving ? { rotate: [-5, 6, -5], transition: loop(cheer ? 0.5 : 2.4) } : { rotate: 0 };
  const head = oops
    ? moving
      ? { rotate: [0, -6, 5, -3, 0], y: [0, 0, 2, 3.5, 3.5], transition: { duration: 0.7 } }
      : { rotate: 0, y: 3.5, transition: settle }
    : !moving
      ? { rotate: 0, y: 0 }
      : cheer
        ? { rotate: [0, -5, 5, -3, 0], y: 0, transition: HOP }
        : wave
          ? { rotate: [0, 6, 0], y: [0, -1.5, 0], transition: loop(1.6) }
          : { rotate: 0, y: [0, -1.8, 0], transition: loop(3.2) };

  // Angles turn clockwise from "hanging straight down", so a positive angle swings a hand to the left.
  const open = mood === "happy" ? 30 : 22;
  const leftPose = cheer ? 136 : oops ? 6 : open;
  const rightPose = cheer ? -136 : wave ? -142 : oops ? -6 : -open;
  const sway = (to: number): Wiggle | null => (!moving || oops ? null : cheer ? { rotate: [0, -to * 4, 0, -to * 4, 0], transition: HOP } : { rotate: [0, to, 0], transition: loop(3.2) });
  const leftWiggle = sway(3.5);
  const rightWiggle = moving && wave ? { rotate: [0, -18, 14, -18, 14, 0], transition: { duration: 1.2, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" as const } } : sway(-3.5);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={size} height={Math.round((size * HEIGHT) / WIDTH)} className={className} role="img" aria-label={animal}>
      <motion.ellipse cx="60" cy="155.5" rx="27" ry="3.5" fill="#1B1433" opacity="0.1" style={pivot(60, 155.5)} animate={shadow} />
      <motion.g style={pivot(60, 156)} animate={figure}>
        <motion.g style={pivot(79, 140)} animate={tail}>
          <Tail animal={animal} look={look} />
        </motion.g>
        <motion.g style={pivot(60, 149)} animate={torso}>
          <ellipse cx="60" cy="124" rx="24" ry="25" fill={look.fur} />
          <ellipse cx="60" cy="128" rx="15" ry="17" fill={look.muzzle} />
        </motion.g>
        {[48, 72].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="150" rx="10.5" ry="6.5" fill={look.fur} stroke={look.shade} strokeWidth="1.5" />
            <ellipse cx={x} cy="151" rx="5" ry="2.8" fill={look.muzzle} />
          </g>
        ))}
        <motion.g style={pivot(60, 104)} animate={head}>
          <g transform="translate(10 18)">
            <AnimalHead look={look} mood={mood} still={still} follow={follow} />
          </g>
        </motion.g>
        <Arm look={look} x={40} y={113} pose={leftPose} wiggle={leftWiggle} still={still} />
        <Arm look={look} x={80} y={113} pose={rightPose} wiggle={rightWiggle} still={still} />
      </motion.g>
    </svg>
  );
}
