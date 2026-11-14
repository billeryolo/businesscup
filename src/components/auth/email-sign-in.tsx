"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string } | { kind: "error"; message: string };

function friendlyError(error: { status?: number; message: string }) {
  if (error.status === 429) return "Too many sign-in emails were sent in a short time. Wait a few minutes and try again.";
  if (!error.status) return "We couldn't reach the sign-in service. Check your connection and try again.";
  return error.message;
}

type Props = {
  /** Where to land after clicking the link in the email. */
  next: string;
  cta?: string;
  /** Runs just before the email is sent, e.g. to stash an unsaved result. */
  onBeforeSend?: () => void;
};

/** Passwordless sign-in: one email, one link. Creates the account on first use. */
export function EmailSignIn({ next, cta = "Email me a sign-in link", onBeforeSend }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    onBeforeSend?.();
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setStatus(error ? { kind: "error", message: friendlyError(error) } : { kind: "sent", email });
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-good-soft p-5">
        <p className="text-lg font-bold">Check your inbox</p>
        <p className="mt-1 text-ink-soft">
          We sent a sign-in link to <strong className="text-ink">{status.email}</strong>. Open it on this device to continue.
        </p>
        <button type="button" onClick={() => setStatus({ kind: "idle" })} className="mt-3 text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-3">
      <label htmlFor="email" className="font-semibold">
        Your email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status.kind === "error"}
        aria-describedby={status.kind === "error" ? "email-error" : undefined}
        className="min-h-12 rounded-xl border-2 border-line bg-sheet px-4 text-lg outline-none focus:border-ink focus:ring-4 focus:ring-sun-soft"
      />
      {status.kind === "error" ? (
        <p id="email-error" role="alert" className="text-sm font-medium text-bad">
          {status.message}
        </p>
      ) : null}
      <Button type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : cta}
      </Button>
      <p className="text-sm text-ink-soft">No password. The link signs you in, and creates your account the first time.</p>
    </form>
  );
}
