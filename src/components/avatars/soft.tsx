"use client";

// A trial of a softer, clay-like look: the same lion, drawn with gradients, soft shadows and a
// highlight so it reads as a little 3D figure. Still an SVG, so it keeps blinking, moods and eyes
// that follow a tap.

import { motion, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { type Mood, pivot, useBlink, useLook } from "./animal";

const loop = (duration: number) => ({ duration, repeat: Infinity, ease: "easeInOut" as const });
const HOP = { duration: 0.9, repeat: Infinity, repeatDelay: 0.6 };

export function SoftLion({ size = 160, mood = "idle", follow = true, className }: { size?: number; mood?: Mood; follow?: boolean; className?: string }) {
  const id = useId();
  const still = useReducedMotion() ?? false;
  const blinking = useBlink(!still);
  const eyes = useRef<SVGGElement>(null);
  const gaze = useLook(eyes, follow && !still);
  const oops = mood === "oops";
  const smiling = mood !== "idle" && !oops;
  const u = (name: string) => `url(#${id}-${name})`;

  const whole = still
    ? undefined
    : mood === "cheer"
      ? { y: [0, -12, 0, -6, 0], scaleY: [1, 1.04, 0.95, 1.02, 1], transition: HOP }
      : mood === "oops"
        ? { y: [0, 0, 1.5, 2.5], rotate: [0, -4, 3, 0], transition: { duration: 0.5 } }
        : { scaleY: [1, 1.025, 1], transition: loop(3.2) };
  const head = still ? undefined : mood === "wave" ? { rotate: [0, 4, 0], transition: loop(1.6) } : mood === "cheer" ? { rotate: [0, -4, 4, -2, 0], transition: HOP } : { y: [0, -1.2, 0], transition: loop(3.2) };
  const rightArm = mood === "wave" ? { rotate: still ? -125 : [-115, -140, -115], transition: loop(0.7) } : mood === "cheer" ? { rotate: still ? -130 : [-120, -140, -120], transition: loop(0.45) } : { rotate: 0 };
  const leftArm = mood === "cheer" ? { rotate: still ? 130 : [120, 140, 120], transition: loop(0.45) } : { rotate: 0 };

  return (
    <svg viewBox="0 0 120 132" width={size} height={(size * 132) / 120} className={className} role="img" aria-label="lion" style={{ overflow: "visible" }}>
      <defs>
        {/* Light comes from the top left: every part is pale there and deeper at the bottom right. */}
        <radialGradient id={`${id}-fur`} cx="0.36" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#FFF1C4" />
          <stop offset="0.5" stopColor="#FFDA8C" />
          <stop offset="1" stopColor="#EEB15C" />
        </radialGradient>
        {/* One gradient across the body, arms and feet, in drawing units, so they shade as one piece. */}
        <radialGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" cx="50" cy="84" r="46">
          <stop offset="0" stopColor="#FFF1C4" />
          <stop offset="0.5" stopColor="#FFDA8C" />
          <stop offset="1" stopColor="#EEB15C" />
        </radialGradient>
        <radialGradient id={`${id}-mane`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFC79A" />
          <stop offset="0.55" stopColor="#F7A56C" />
          <stop offset="1" stopColor="#E2854E" />
        </radialGradient>
        <radialGradient id={`${id}-cream`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#FBE5C0" />
        </radialGradient>
        <radialGradient id={`${id}-eye`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5A4347" />
          <stop offset="1" stopColor="#2E2024" />
        </radialGradient>
        <filter id={`${id}-blur1`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
        <filter id={`${id}-blur3`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="60" cy="124" rx="34" ry="5" fill="#3B2A1A" opacity="0.16" filter={u("blur3")} />

      <motion.g style={pivot(60, 124)} animate={whole}>
        {/* tail */}
        <path d="M82 108 Q104 110 100 90" fill="none" stroke="#EEB15C" strokeWidth="5" strokeLinecap="round" />
        <circle cx="100" cy="88" r="7" fill={u("mane")} />

        {/* feet, body, belly */}
        <ellipse cx="46" cy="119" rx="10" ry="6" fill={u("body")} />
        <ellipse cx="74" cy="119" rx="10" ry="6" fill={u("body")} />
        <ellipse cx="60" cy="98" rx="27" ry="24" fill={u("body")} />
        <ellipse cx="60" cy="102" rx="15" ry="14" fill={u("cream")} />
        {/* the head's shadow on the body */}
        <ellipse cx="60" cy="82" rx="23" ry="7" fill="#B9742F" opacity="0.3" filter={u("blur3")} />

        {/* arms: they grow out of the shoulders and share the body's shading, so there is no seam */}
        <motion.g style={pivot(41, 88)} animate={leftArm}>
          <path d="M42.500 89.500 Q36 95 35 104" fill="none" stroke="#B9742F" strokeWidth="11" strokeLinecap="round" opacity="0.28" filter={u("blur1")} />
          <path d="M41 88 Q34 94 33 103" fill="none" stroke={u("body")} strokeWidth="12" strokeLinecap="round" />
        </motion.g>
        <motion.g style={pivot(79, 88)} animate={rightArm}>
          <path d="M80.500 89.500 Q87.500 95 88.500 104" fill="none" stroke="#B9742F" strokeWidth="11" strokeLinecap="round" opacity="0.28" filter={u("blur1")} />
          <path d="M79 88 Q86 94 87 103" fill="none" stroke={u("body")} strokeWidth="12" strokeLinecap="round" />
        </motion.g>

        <motion.g style={pivot(60, 80)} animate={head}>
          {/* mane: a ring of soft blobs, each with its own light */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 + 0.26;
            return <circle key={i} cx={Math.round((60 + Math.cos(a) * 29) * 10) / 10} cy={Math.round((50 + Math.sin(a) * 28) * 10) / 10} r="11.5" fill={u("mane")} />;
          })}
          <circle cx="60" cy="50" r="30" fill="#F29D62" />
          {/* ears */}
          <circle cx="37" cy="24" r="8.5" fill={u("fur")} />
          <circle cx="83" cy="24" r="8.5" fill={u("fur")} />
          <circle cx="37.5" cy="25" r="4.6" fill="#F7A98A" />
          <circle cx="82.5" cy="25" r="4.6" fill="#F7A98A" />
          {/* the face's shadow on the mane, then the face */}
          <ellipse cx="61" cy="54" rx="30" ry="28" fill="#A8541C" opacity="0.35" filter={u("blur1")} />
          <ellipse cx="60" cy="52" rx="29.5" ry="27.5" fill={u("fur")} />
          {/* soft highlight */}
          <ellipse cx="47" cy="36" rx="12" ry="6" transform="rotate(-24 47 36)" fill="#fff" opacity="0.5" filter={u("blur3")} />

          {/* cheeks */}
          <ellipse cx="39" cy="61" rx="6.5" ry="4.3" fill="#FF9A9A" opacity="0.6" filter={u("blur1")} />
          <ellipse cx="81" cy="61" rx="6.5" ry="4.3" fill="#FF9A9A" opacity="0.6" filter={u("blur1")} />

          {/* muzzle */}
          <ellipse cx="60" cy="63" rx="11.5" ry="8.5" fill={u("cream")} />

          {oops ? (
            <g fill="none" stroke="#5A3A32" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
              <path d="M41.500 45.500 Q45.500 43 50 43.600" />
              <path d="M78.500 45.500 Q74.500 43 70 43.600" />
            </g>
          ) : null}

          {/* eyes: small, glossy and wide apart */}
          <g ref={eyes} style={{ transformOrigin: "60px 53px", transform: `scaleY(${blinking ? 0.1 : 1})`, transition: "transform 90ms ease-out" }}>
            <motion.g style={{ x: gaze.x, y: gaze.y }}>
              <ellipse cx="46" cy="53" rx="3.700" ry="4.200" fill={u("eye")} />
              <ellipse cx="74" cy="53" rx="3.700" ry="4.200" fill={u("eye")} />
              <motion.g style={{ x: gaze.shineX, y: gaze.shineY }} fill="#fff">
                <circle cx="47.200" cy="51.500" r={smiling ? 1.500 : 1.200} />
                <circle cx="75.200" cy="51.500" r={smiling ? 1.500 : 1.200} />
              </motion.g>
            </motion.g>
          </g>

          {/* nose and mouth */}
          <ellipse cx="60" cy="58.800" rx="3.400" ry="2.400" fill="#8A4B3A" />
          <ellipse cx="59.200" cy="58.100" rx="1.200" ry="0.600" fill="#fff" opacity="0.5" />
          {oops ? (
            <ellipse cx="60" cy="65.500" rx="2.300" ry="2.700" fill="#E8707F" stroke="#5A3A32" strokeWidth="1.500" />
          ) : (
            <path d={smiling ? "M55 62.800 Q60 70.500 65 62.800 Z" : "M56 63.200 Q60 66.800 64 63.200"} fill={smiling ? "#E8707F" : "none"} stroke="#5A3A32" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </motion.g>
      </motion.g>
    </svg>
  );
}
