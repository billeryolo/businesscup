"use client";

// A soft line under a Plus feature: what it is and where to start the free trial. Hidden once
// a trial was started on this phone, and when printed.

import Link from "next/link";
import { useTrial } from "@/lib/plus";

export function PlusNote({ className = "" }: { className?: string }) {
  const trial = useTrial();
  if (trial !== null) return null;
  return (
    <Link href="/plans" className={`block text-center text-xs font-semibold text-night-soft underline-offset-4 hover:underline print:hidden ${className}`}>
      Part of ReadBuddy Plus · 7 days free →
    </Link>
  );
}
