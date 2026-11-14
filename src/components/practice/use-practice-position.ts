"use client";

import { useMemo, useState } from "react";
import { align, type SpokenWord } from "@/lib/reading/align";
import type { PassageWord } from "@/lib/reading/text";

const NOTHING: SpokenWord[] = [];

/**
 * Where the reader is in a practice story. Tapping moves it; when listening, it also moves past
 * every word heard read correctly since the last tap. Derived from the transcript, so a word the
 * recognizer revises a moment later is handled too.
 */
export function usePracticePosition(passage: PassageWord[], spoken: SpokenWord[] | null) {
  const [anchor, setAnchor] = useState({ base: 0, offset: 0 });
  const heard = spoken ?? NOTHING;

  const ahead = useMemo(() => {
    const since = heard.slice(anchor.offset);
    if (!since.length) return 0;
    const a = align(passage.slice(anchor.base), since);
    let last = -1;
    for (const w of a.words) if (w.status === "correct" && w.index <= a.lastAttempted) last = w.index;
    return last + 1;
  }, [passage, heard, anchor]);

  const position = Math.min(passage.length, anchor.base + ahead);
  const goTo = (p: number) => setAnchor({ base: Math.max(0, Math.min(passage.length, p)), offset: heard.length });
  /** Back to the first word, for a fresh transcript. */
  const reset = () => setAnchor({ base: 0, offset: 0 });
  return { position, goTo, reset };
}
