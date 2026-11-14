"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SpeedMath } from "@/components/games/speed-math";
import { KidStage } from "@/components/kid/stage";
import { useFamily } from "@/lib/store/family";

export default function SpeedMathPage() {
  const router = useRouter();
  const { ready, active: kid } = useFamily();
  useEffect(() => {
    if (ready && !kid) router.replace("/welcome");
  }, [ready, kid, router]);

  // Back to wherever the game was opened from: kid mode, or the parent's Learn tab.
  const exit = () => (window.history.length > 1 ? router.back() : router.replace("/play"));

  if (!kid) return <div className="min-h-dvh flex-1 bg-sky" />;
  return (
    <KidStage>
      <SpeedMath key={kid.id} kid={kid} onExit={exit} />
    </KidStage>
  );
}
