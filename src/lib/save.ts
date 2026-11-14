"use client";

// Saving results to the signed-in parent's account. Row-level security in the database makes
// sure a parent can only touch their own rows; these helpers just shape the writes.

import type { Json } from "@/lib/supabase/database.types";
import type { BrowserClient } from "@/lib/supabase/client";
import type { ReadingRecord } from "@/lib/reading/record";
import type { ParentSummary } from "@/lib/reading/summary";
import { readConsent } from "./pending";

export const MAX_CHILDREN = 3;

export class ChildLimitError extends Error {
  constructor() {
    super(`An account can track up to ${MAX_CHILDREN} children.`);
  }
}

type SaveInput = {
  childId: string | null;
  childName: string;
  record: ReadingRecord;
  summary: ParentSummary | null;
};

/** Finds the child (by id, or by first name) or adds them, then stores the reading. */
export async function saveReading(supabase: BrowserClient, input: SaveInput): Promise<{ childId: string; readingId: string }> {
  const childId = await ensureChild(supabase, input.childId, input.childName, input.record.grade);
  const r = input.record;
  const { data, error } = await supabase
    .from("readings")
    .insert({
      child_id: childId,
      read_at: r.readAt,
      passage_id: r.passageId,
      grade: r.grade,
      season: r.season,
      mode: r.mode,
      seconds: r.seconds,
      attempted: r.attempted,
      errors: r.errors,
      wcpm: r.wcpm,
      accuracy: r.accuracy,
      verdict: r.verdict,
      band: r.band,
      patterns: r.patterns,
      word_statuses: r.wordStatuses,
      summary: (input.summary as unknown as Json) ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordConsent(supabase);
  return { childId, readingId: data.id };
}

async function ensureChild(supabase: BrowserClient, childId: string | null, name: string, grade: number): Promise<string> {
  if (childId) {
    const { data } = await supabase.from("children").select("id").eq("id", childId).maybeSingle();
    if (data) return data.id;
  }
  const firstName = name.trim() || "My child";
  const { data: children, error } = await supabase.from("children").select("id, first_name, grade");
  if (error) throw error;
  const match = children.find((c) => c.first_name.toLowerCase() === firstName.toLowerCase());
  if (match) {
    if (match.grade !== grade) await supabase.from("children").update({ grade }).eq("id", match.id);
    return match.id;
  }
  if (children.length >= MAX_CHILDREN) throw new ChildLimitError();
  const { data: created, error: insertError } = await supabase.from("children").insert({ first_name: firstName, grade }).select("id").single();
  if (insertError) throw insertError;
  return created.id;
}

export async function updateReadingSummary(supabase: BrowserClient, readingId: string, summary: ParentSummary) {
  await supabase.from("readings").update({ summary: summary as unknown as Json }).eq("id", readingId);
}

/** Copies the microphone consent given on this device to the account, once. */
async function recordConsent(supabase: BrowserClient) {
  const consent = readConsent();
  if (!consent) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("profiles")
    .update({ consent_version: consent.version, consent_at: consent.at })
    .eq("id", data.user.id)
    .is("consent_at", null);
}
