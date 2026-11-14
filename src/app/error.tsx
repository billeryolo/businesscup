"use client";

import { useEffect } from "react";
import { Button, LinkButton, Logo } from "@/components/ui";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16">
      <header className="py-5">
        <Logo />
      </header>
      <main className="mt-10 flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Something went wrong</h1>
        <p className="text-lg text-ink-soft">
          This page hit an error on our side. Trying again usually works.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => retry()}>Try again</Button>
          <LinkButton href="/" variant="secondary">
            Go to the home page
          </LinkButton>
        </div>
      </main>
    </div>
  );
}
