"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFamily } from "@/lib/store/family";

/** Opening the app: families with a child go to Home, everyone else to the welcome flow. */
export function LaunchGate() {
  const router = useRouter();
  const { ready, active } = useFamily();
  useEffect(() => {
    if (ready) router.replace(active ? "/home" : "/welcome");
  }, [ready, active, router]);
  return <div className="min-h-dvh flex-1 bg-lilac" />;
}
