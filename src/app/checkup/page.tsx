"use client";

// A new 1-minute check for the child selected on Home.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckFlow } from "@/components/onboarding/check-flow";
import { useFamily } from "@/lib/store/family";

export default function CheckupPage() {
  const router = useRouter();
  const { ready, active } = useFamily();
  useEffect(() => {
    if (ready && !active) router.replace("/welcome");
  }, [ready, active, router]);

  return (
    <div className="min-h-dvh flex-1 bg-lilac font-app text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-clip bg-mist px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] shadow-[0_0_60px_rgba(27,20,51,0.18)]">
        {active ? <CheckFlow key={active.id} kid={active} exitLabel="Not now" onExit={() => router.push("/home")} onBack={() => router.push("/home")} /> : null}
      </div>
    </div>
  );
}
