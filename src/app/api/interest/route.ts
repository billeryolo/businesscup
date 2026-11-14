import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// The interest test: records a "start free trial" click. Nothing is charged during the beta.

const Body = z.object({
  plan: z.enum(["yearly", "monthly"]),
  grade: z.number().int().min(1).max(4).nullable(),
  verdict: z.enum(["onTrack", "practice", "talkToTeacher"]).nullable(),
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (!isSupabaseConfigured) return new Response(null, { status: 204 });

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  // No read-back: the table is write-only for the app.
  const { error } = await supabase.from("trial_interest").insert(body.data);
  if (error) {
    console.error("Interest test insert failed", error.message);
    return Response.json({ error: "Could not record" }, { status: 500 });
  }
  if (data.user) {
    await supabase.from("profiles").update({ trial_plan: body.data.plan, trial_requested_at: new Date().toISOString() }).eq("id", data.user.id);
  }
  return new Response(null, { status: 204 });
}
