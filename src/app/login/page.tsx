import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, Logo } from "@/components/ui";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "Sign in — ReadBuddy", robots: { index: false, follow: true } };

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Logo />
        </div>
        <Card className="mt-8">
          <h1 className="text-2xl font-bold tracking-tight">Sign in to see your child&apos;s progress</h1>
          <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-xl bg-line" />}>
            <LoginPanel />
          </Suspense>
        </Card>
        <p className="mt-6 text-center text-sm text-ink-soft">
          By continuing you agree to the{" "}
          <Link href="/terms" className="font-semibold underline-offset-4 hover:underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
