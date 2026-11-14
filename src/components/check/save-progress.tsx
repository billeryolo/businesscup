"use client";

import Link from "next/link";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { Card } from "@/components/ui";

export type SaveState = "idle" | "saving" | "saved" | "error" | "limit";

export type AccountState = {
  configured: boolean;
  signedIn: boolean;
  saveState: SaveState;
};

/** Saving the result to an account: a sign-in box for visitors, a status line once signed in. */
export function SaveProgress({ account, childName }: { account: AccountState; childName: string }) {
  if (!account.configured) return null;
  const name = childName.trim() || "your child";

  if (account.signedIn) {
    const line = {
      idle: null,
      saving: <span className="text-ink-soft">Saving to your account…</span>,
      saved: (
        <>
          Saved to your account.{" "}
          <Link href="/dashboard" className="font-semibold text-brand-deep underline underline-offset-4">
            See {name}&apos;s progress
          </Link>
        </>
      ),
      error: <span className="text-bad">This result couldn&apos;t be saved. Check your connection and try another check later.</span>,
      limit: <span className="text-bad">Your account already tracks 3 children, so this result wasn&apos;t saved.</span>,
    }[account.saveState];
    return line ? <p className="rounded-xl bg-brand-soft px-4 py-3">{line}</p> : null;
  }

  return (
    <Card>
      <h2 className="text-xl font-bold">Track {name}&apos;s progress</h2>
      <p className="mt-2 text-ink-soft">
        Save this result, then re-check every week with a new story and watch the trend. Free during the beta.
      </p>
      <div className="mt-4">
        <EmailSignIn next="/dashboard" cta="Save the result" />
      </div>
    </Card>
  );
}
