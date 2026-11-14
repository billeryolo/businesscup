import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Logo } from "@/components/ui";
import { seasonFor } from "@/lib/reading/norms";
import type { ParentSummary } from "@/lib/reading/summary";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My children — ReadBuddy", robots: { index: false } };

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16">
      <header className="flex items-center justify-between gap-4 py-5">
        <Logo />
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Sign out
          </button>
        </form>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-line" aria-label="Loading" />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

async function DashboardData() {
  if (!isSupabaseConfigured) redirect("/login");
  // Session checks compare token expiry with the clock, so this part only runs for a real request.
  await connection();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/dashboard");

  const [{ data: children }, { data: readings }, { data: profile }] = await Promise.all([
    supabase.from("children").select("id, first_name, grade, created_at").order("created_at"),
    supabase.from("readings").select("id, child_id, read_at, passage_id, wcpm, accuracy, verdict, season, mode, summary").order("read_at"),
    supabase.from("profiles").select("trial_plan").eq("id", auth.user.id).maybeSingle(),
  ]);

  return (
    <Dashboard
      email={auth.user.email ?? ""}
      season={seasonFor(new Date())}
      trialPlan={profile?.trial_plan ?? null}
      childList={(children ?? []).map((c) => ({
        id: c.id,
        firstName: c.first_name,
        grade: c.grade,
        readings: (readings ?? [])
          .filter((r) => r.child_id === c.id)
          .map((r) => ({
            id: r.id,
            readAt: r.read_at,
            passageId: r.passage_id,
            wcpm: r.wcpm,
            accuracy: r.accuracy,
            verdict: r.verdict,
            mode: r.mode,
            summary: r.summary as unknown as ParentSummary | null,
          })),
      }))}
    />
  );
}
