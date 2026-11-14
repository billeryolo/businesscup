import type { Metadata } from "next";
import { LinkButton, Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found — ReadCheck", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16">
      <header className="py-5">
        <Logo />
      </header>
      <main className="mt-10 flex flex-col gap-4">
        <p className="font-mono text-sm font-semibold text-ink-soft">404</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">This page isn&apos;t here</h1>
        <p className="text-lg text-ink-soft">The link may be old or mistyped. The reading check itself is one tap away.</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/check">Start the free check</LinkButton>
          <LinkButton href="/" variant="secondary">
            Go to the home page
          </LinkButton>
        </div>
      </main>
    </div>
  );
}
