"use client";

import { useSearchParams } from "next/navigation";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function LoginPanel() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const linkError = params.get("error") === "link";

  if (!isSupabaseConfigured) {
    return <p className="mt-6 rounded-xl bg-warn-soft px-4 py-3 text-ink">Accounts aren&apos;t set up on this deployment yet. The free check works without one.</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      {linkError ? (
        <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3">
          That sign-in link expired or was already used. Request a new one below.
        </p>
      ) : null}
      <EmailSignIn next={next} />
    </div>
  );
}
