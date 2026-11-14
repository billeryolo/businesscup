import type { Metadata } from "next";
import { Suspense } from "react";
import { PracticeFlow } from "@/components/practice/practice-flow";
import { Logo } from "@/components/ui";

export const metadata: Metadata = {
  title: "Reading practice: big words and syllables — ReadCheck",
  description: "Practice reading one big word at a time, or with words split into syllables. Free, no sign-up.",
  alternates: { canonical: "/practice" },
};

export default function PracticePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16">
      <header className="py-5">
        <Logo />
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-line" aria-label="Loading" />}>
        <PracticeFlow />
      </Suspense>
    </div>
  );
}
