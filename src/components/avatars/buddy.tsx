"use client";

// The full-body friend for kid screens: the same head as the avatar on a chubby body. Body, arms
// and feet share one shading so they read as a single soft figure. It breathes, jumps to cheer,
// waves an arm to say hello, and slumps a little for "oops".

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { AnimalId } from "@/lib/store/family";
import { AnimalHead, LOOKS, type Look, type Mood, pivot, SoftDefs } from "./animal";

const WIDTH = 120;
const HEIGHT = 132;
const HOP = { duration: 0.9, repeat: Infinity, repeatDelay: 0.6 };
const loop = (duration: number) => ({ duration, repeat: Infinity, ease: "easeInOut" as const });

type Wiggle = { rotate: number[]; transition: object };

function Tail({ animal, look, u }: { animal: AnimalId; look: Look; u: (name: string) => string }) {
  switch (animal) {
    case "fox":
      return (
        <g fill="none" strokeWidth="14" strokeLinecap="round">
          <path d="M78 110 Q105 112 102 86" stroke={look.fur[1]} />
          <path d="M102.600 92 Q102.800 89 102 86" stroke={look.cream[0]} />
        </g>
      );
    case "lion":
      return (
        <>
          <path d="M82 108 Q104 110 100 90" fill="none" stroke={look.fur[2]} strokeWidth="5" strokeLinecap="round" />
          <circle cx="100" cy="88" r="7" fill={u("acc")} />
        </>
      );
    case "monkey":
      return <path d="M80 109 Q106 111 105 91 Q104 77 94 80 Q88 83 92 89" fill="none" stroke={look.fur[2]} strokeWidth="5" strokeLinecap="round" />;
    case "bunny":
      return <circle cx="85" cy="109" r="7.500" fill={u("cream")} stroke={look.fur[2]} strokeWidth="1" />;
    case "bear":
      return <circle cx="84" cy="108" r="6" fill={u("fur")} />;
    default:
      return null;
  }
}

/**
 * An arm that grows out of the shoulder. `pose` is its resting angle; `wiggle` is movement on top.
 * `side` is -1 for the arm on the left of the picture and 1 for the one on the right.
 */
function Arm({ look, u, side, pose, wiggle, still }: { look: Look; u: (name: string) => string; side: -1 | 1; pose: number; wiggle: Wiggle | null; still: boolean }) {
  const x = 60 + side * 19;
  const y = 89;
  const limb = `M${x} ${y} Q${x + side * 7} ${y + 6} ${x + side * 8} ${y + 15}`;
  return (
    <motion.g style={pivot(x, y)} initial={false} animate={{ rotate: pose }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }}>
      <motion.g style={pivot(x, y)} animate={wiggle ?? { rotate: 0 }}>
        <path d={limb} transform="translate(1.500 1.500)" fill="none" stroke={look.shadow} strokeWidth="11" strokeLinecap="round" opacity="0.26" filter={u("blur1")} />
        <path d={limb} fill="none" stroke={u("body")} strokeWidth="12" strokeLinecap="round" />
      </motion.g>
    </motion.g>
  );
}

/**
 * Full-body animal. `size` is the width; the figure is a little taller than wide (height = size * 1.1).
 * Moods match the head-only avatar. `follow` lets the eyes glance at nearby taps.
 */
export function AnimalBuddy({ animal, size = 120, mood = "idle", follow = true, className }: { animal: AnimalId; size?: number; mood?: Mood; follow?: boolean; className?: string }) {
  const id = useId();
  const look = LOOKS[animal];
  const u = (name: string) => `url(#${id}-${name})`;
  const still = useReducedMotion() ?? false;
  const moving = !still;
  const cheer = mood === "cheer";
  const oops = mood === "oops";
  const wave = mood === "wave";
  const settle = still ? { duration: 0 } : { duration: 0.35 };

  const figure = moving && cheer ? { y: [0, -10, 0, -6, 0], scaleY: [1, 1.04, 0.95, 1.03, 1], transition: HOP } : { y: 0, scaleY: 1, transition: settle };
  const shadow = moving && cheer ? { scaleX: [1, 0.8, 1, 0.88, 1], transition: HOP } : { scaleX: 1, transition: settle };
  const torso = oops ? { scaleY: 0.96, transition: settle } : moving ? { scaleY: [1, 1.03, 1], transition: loop(3.2) } : { scaleY: 1 };
  const tail = oops ? { rotate: 8, transition: settle } : moving ? { rotate: [-5, 6, -5], transition: loop(cheer ? 0.5 : 2.4) } : { rotate: 0 };
  const head = oops
    ? moving
      ? { rotate: [0, -6, 5, -3, 0], y: [0, 0, 1.5, 2.5, 2.5], transition: { duration: 0.7 } }
      : { rotate: 0, y: 2.5, transition: settle }
    : !moving
      ? { rotate: 0, y: 0 }
      : cheer
        ? { rotate: [0, -5, 5, -3, 0], y: 0, transition: HOP }
        : wave
          ? { rotate: [0, 5, 0], y: [0, -1.2, 0], transition: loop(1.6) }
          : { rotate: 0, y: [0, -1.2, 0], transition: loop(3.2) };

  // Angles turn clockwise from the resting arm, so a positive angle swings the left hand up and out.
  const leftPose = cheer ? 118 : mood === "happy" ? 12 : 0;
  const rightPose = cheer ? -118 : wave ? -122 : mood === "happy" ? -12 : 0;
  const sway = (to: number): Wiggle | null => (!moving || oops ? null : cheer ? { rotate: [0, to * 5, 0, to * 5, 0], transition: HOP } : { rotate: [0, to, 0], transition: loop(3.2) });
  const leftWiggle = sway(2.5);
  const rightWiggle = moving && wave ? { rotate: [0, -16, 12, -16, 12, 0], transition: { duration: 1.2, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" as const } } : sway(-2.5);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={size} height={Math.round((size * HEIGHT) / WIDTH)} className={className} role="img" aria-label={animal} style={{ overflow: "visible" }}>
      <SoftDefs id={id} look={look} bodyLight={{ cx: 50, cy: 84, r: 46 }} />
      <motion.ellipse cx="60" cy="124" rx="34" ry="5" fill="#3B2A1A" opacity="0.16" filter={u("blur3")} style={pivot(60, 124)} animate={shadow} />
      <motion.g style={pivot(60, 124)} animate={figure}>
        <motion.g style={pivot(80, 109)} animate={tail}>
          <Tail animal={animal} look={look} u={u} />
        </motion.g>
        <ellipse cx="46" cy="119" rx="10" ry="6" fill={u("body")} />
        <ellipse cx="74" cy="119" rx="10" ry="6" fill={u("body")} />
        <motion.g style={pivot(60, 122)} animate={torso}>
          <ellipse cx="60" cy="98" rx="27" ry="24" fill={u("body")} />
          <ellipse cx="60" cy="102" rx="15" ry="14" fill={u("cream")} />
          {/* the head's shadow on the body */}
          <ellipse cx="60" cy="82" rx="23" ry="7" fill={look.shadow} opacity="0.28" filter={u("blur3")} />
        </motion.g>
        <motion.g style={pivot(60, 80)} animate={head}>
          <g transform="translate(15.400 4) scale(0.892)">
            <AnimalHead id={id} look={look} mood={mood} still={still} follow={follow} />
          </g>
        </motion.g>
        {/* arms come last so a raised hand is in front of the head */}
        <Arm look={look} u={u} side={-1} pose={leftPose} wiggle={leftWiggle} still={still} />
        <Arm look={look} u={u} side={1} pose={rightPose} wiggle={rightWiggle} still={still} />
      </motion.g>
    </svg>
  );
}
