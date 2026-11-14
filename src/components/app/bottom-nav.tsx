"use client";

// The bottom bar: two tabs, the big assistant button, two tabs. The dark circle slides to the
// active tab; the centre button glows and opens the assistant from anywhere.
// The circle is one element moved sideways by column. (A shared-layout animation measured the
// page, so it flew in from below whenever the scroll position changed between screens.)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

type IconProps = { className?: string };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const HomeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M3.5 11 12 4l8.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-4v-5.5h-6v5.5H5A1.5 1.5 0 0 1 3.5 19z" />
  </svg>
);
const LearnIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.500 0 8.500 1.500 2-1.500 5-2 8.500-1.500V5C17 4.500 14 5 12 6.500z" />
    <path d="M12 6.500V19.500" />
  </svg>
);
const ProgressIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M5 20v-7M12 20V5M19 20v-10" />
  </svg>
);
const FamilyIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <circle cx="9" cy="8.500" r="3.300" />
    <path d="M3 19.500a6 6 0 0 1 12 0" />
    <circle cx="17.500" cy="9.500" r="2.400" />
    <path d="M16.500 14.300a4.600 4.600 0 0 1 4.500 5.200" />
  </svg>
);
const SparkIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.500l2 5.500 5.500 2-5.500 2-2 5.500-2-5.500-5.500-2 5.500-2z" />
    <path d="M18.500 15.500l.900 2.100 2.100.900-2.100.900-.900 2.100-.900-2.100-2.100-.900 2.100-.900z" opacity="0.85" />
  </svg>
);

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/learn", label: "Learn", Icon: LearnIcon },
  null, // the centre button
  { href: "/progress", label: "Progress", Icon: ProgressIcon },
  { href: "/family", label: "Family", Icon: FamilyIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((tab) => tab && (pathname === tab.href || pathname.startsWith(`${tab.href}/`)));

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto relative grid h-[68px] w-full grid-cols-5 items-center rounded-[34px] bg-white/90 px-2 shadow-[0_10px_30px_rgba(27,20,51,0.16)] backdrop-blur-md">
        {activeIndex >= 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-x-2 inset-y-0">
            <motion.div
              initial={false}
              animate={{ x: `${activeIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="grid h-full w-1/5 place-items-center"
            >
              <span className="h-[52px] w-[52px] rounded-full bg-night" />
            </motion.div>
          </div>
        )}
        {TABS.map((tab) => {
          if (!tab) {
            return (
              <Link key="assistant" href="/assistant" aria-label="AI assistant" className="group relative grid place-items-center">
                <motion.span whileTap={{ scale: 0.9 }} className="assistant-orb relative -mt-9 grid h-[66px] w-[66px] place-items-center rounded-full text-white">
                  <SparkIcon className="h-7 w-7" />
                </motion.span>
              </Link>
            );
          }
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className="relative grid h-[52px] place-items-center"
            >
              <motion.span whileTap={{ scale: 0.85 }} className={`relative ${active ? "text-white" : "text-night/55"}`}>
                <tab.Icon className="h-6 w-6" />
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
