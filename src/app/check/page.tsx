import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckFlow } from "@/components/check/check-flow";

export const metadata: Metadata = {
  title: "Free 1-minute reading check — ReadCheck",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-24 h-48 w-full max-w-3xl animate-pulse rounded-2xl bg-line" />}>
      <CheckFlow />
    </Suspense>
  );
}
