"use client";

// The parent's chat with the assistant. The screen opens on the pearl and a few ready questions;
// once a question is asked the pearl moves up into the header and the answers arrive as they
// are written. The child's name stays on this phone: it is swapped for a placeholder on the way
// out and put back on the way in.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AvatarBubble } from "@/components/avatars/animal";
import { Icon } from "@/components/icons";
import { type ChatMessage, factsFor, hideName, rulesReply, showName, suggestionsFor } from "@/lib/assistant/chat";
import { useDictation } from "@/lib/speech/dictation";
import { say } from "@/lib/speech/say";
import { chatActions, useChat } from "@/lib/store/assistant";
import { type CheckRecord, useChecks } from "@/lib/store/checks";
import { type Kid, useFamily } from "@/lib/store/family";
import { Orb } from "./orb";

const SEND_LAST = 19;
const soft = "shadow-[0_6px_20px_rgba(27,20,51,0.06)]";

/** Asks the server and yields the answer piece by piece; offline, the built-in answer is used. */
async function* answer(history: ChatMessage[], kid: Kid, checks: CheckRecord[], signal: AbortSignal): AsyncGenerator<string> {
  const facts = factsFor(kid, checks);
  let recent = history.slice(-SEND_LAST);
  if (recent[0].role !== "user") recent = recent.slice(1);
  const messages = recent.map((m) => ({ role: m.role, text: hideName(m.text, kid.name).slice(0, 2000) }));
  let got = false;
  try {
    const response = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages, facts }),
      signal,
    });
    if (!response.ok || !response.body) throw new Error(`Assistant answered ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const piece = decoder.decode(value, { stream: true });
      if (piece) {
        got = true;
        yield piece;
      }
    }
  } catch (error) {
    if (signal.aborted) return;
    console.warn("Assistant: using the built-in answer", error);
  }
  if (!got && !signal.aborted) yield rulesReply(messages[messages.length - 1].text, facts);
}

/** A half-arrived placeholder at the end of the text is held back until the rest lands. */
const shown = (text: string, name: string) => showName(text, name).replace(/\{\{?[a-z]*\}?$/, "");

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <span key={i} className="block h-2" />;
        const item = /^\s*[-•]\s+/.exec(line);
        if (!item) return <span key={i} className="block">{line}</span>;
        return (
          <span key={i} className="mt-1.5 flex gap-2.5">
            <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-[#9a88f2]" />
            <span>{line.slice(item[0].length)}</span>
          </span>
        );
      })}
    </>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`max-w-[86%] flex-none px-4 py-3 text-[15px] leading-relaxed ${
        mine ? "self-end rounded-[22px] rounded-br-lg bg-night text-white" : `self-start rounded-[22px] rounded-bl-lg bg-white ${soft}`
      }`}
    >
      <Lines text={message.text} />
    </motion.div>
  );
}

function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-1.5 self-start rounded-[22px] rounded-bl-lg bg-white px-4 py-4 ${soft}`} aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-2 w-2 rounded-full bg-[#9a88f2]" animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.14 }} />
      ))}
    </motion.div>
  );
}

const Back = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 5.500 8 12l6.500 6.500" />
  </svg>
);
const Mic = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3.500" width="6" height="11" rx="3" />
    <path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3" />
  </svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5.500M6 11l6-6 6 6" />
  </svg>
);

export function AssistantChat() {
  const { ready, active } = useFamily();
  const checks = useChecks(active?.id);
  const messages = useChat(active?.id);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const control = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const busy = draft !== null;
  const chatting = messages.length > 0 || busy;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, draft]);
  useEffect(() => () => control.current?.abort(), []);

  const send = async (raw: string, aloud = false) => {
    const text = raw.trim();
    if (!text || busy || !active) return;
    const history: ChatMessage[] = [...messages, { role: "user", text }];
    chatActions.set(active.id, history);
    setInput("");
    setDraft("");
    const mine = new AbortController();
    control.current = mine;
    let reply = "";
    for await (const piece of answer(history, active, checks, mine.signal)) {
      reply += piece;
      setDraft(shown(reply, active.name));
    }
    if (mine.signal.aborted) return;
    const final = showName(reply, active.name).trim();
    chatActions.set(active.id, [...history, { role: "assistant", text: final }]);
    setDraft(null);
    if (aloud) say(final.replace(/^\s*[-•]\s+/gm, ""));
  };

  // Hold to talk: the question is sent on release and the answer is read aloud.
  const dictation = useDictation((spoken) => send(spoken, true));

  const startOver = () => {
    control.current?.abort();
    setDraft(null);
    if (active) chatActions.clear(active.id);
  };

  return (
    <div className="flex min-h-dvh flex-1 justify-center bg-lilac font-app text-night">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-mist">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="aurora absolute -left-24 -top-20 h-72 w-72 rounded-full bg-lilac opacity-70 blur-3xl" />
          <span className="aurora absolute -right-28 top-40 h-72 w-72 rounded-full bg-candy opacity-30 blur-3xl [animation-delay:-6s]" />
          <span className="aurora absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-sky opacity-60 blur-3xl [animation-delay:-11s]" />
        </div>

        <header className="relative z-10 flex items-center gap-3 px-5 pb-3 pt-[max(18px,env(safe-area-inset-top))]">
          <Link href="/home" aria-label="Back to Home" className={`grid h-11 w-11 flex-none place-items-center rounded-full bg-white ${soft}`}>
            <Back />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {chatting && (
              <>
                <motion.span layoutId="pearl" transition={{ type: "spring", stiffness: 260, damping: 28 }}>
                  <Orb size={38} busy={busy} />
                </motion.span>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-tight">Assistant</span>
                  <span className="block truncate text-xs text-night-soft">{busy ? "Writing…" : active ? `About ${active.name}` : ""}</span>
                </motion.span>
              </>
            )}
          </div>
          {chatting ? (
            <button type="button" onClick={startOver} className={`flex-none rounded-full bg-white px-4 py-2.5 text-xs font-semibold ${soft}`}>
              New chat
            </button>
          ) : (
            active && (
              <span className={`flex flex-none items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3.5 text-sm font-semibold ${soft}`}>
                <AvatarBubble animal={active.avatar} size={34} follow={false} />
                {active.name}
              </span>
            )
          )}
        </header>

        {!ready ? (
          <div className="flex-1" />
        ) : !active ? (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
            <Orb size={132} />
            <h1 className="mt-10 text-2xl font-semibold tracking-tight">Add a child first</h1>
            <p className="mt-2 text-night-soft">Then I can answer with real numbers from practice and checks.</p>
            <Link href="/home" className="mt-6 rounded-full bg-night px-6 py-3.5 text-sm font-semibold text-white">Go to Home</Link>
          </div>
        ) : !chatting ? (
          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-2 [scrollbar-width:none]">
            <motion.span layoutId="pearl" className="mt-[5dvh] flex-none" transition={{ type: "spring", stiffness: 260, damping: 28 }}>
              <Orb size={156} />
            </motion.span>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.35 }} className="mt-9 flex-none text-night-soft">
              Hello!
            </motion.p>
            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }} className="mt-1 flex-none text-center text-[30px] font-semibold leading-[1.15] tracking-tight">
              How can I help
              <br />
              with {active.name} today?
            </motion.h1>
            <div className="mt-auto grid w-full flex-none grid-cols-2 gap-3 pt-8">
              {suggestionsFor(active.name).map((s, i) => (
                <motion.button
                  key={s.label}
                  type="button"
                  onClick={() => send(s.ask)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex min-h-[96px] flex-col items-start justify-between gap-3 rounded-[24px] bg-white/85 p-4 text-left text-sm font-medium leading-snug ${soft}`}
                >
                  <Icon name={s.icon} size={26} className="flex-none" />
                  {s.label}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={list} className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 pt-2" aria-live="polite">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
            <AnimatePresence>{busy && (draft ? <Bubble key="draft" message={{ role: "assistant", text: draft }} /> : <Thinking key="thinking" />)}</AnimatePresence>
          </div>
        )}

        {active && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="relative z-10 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-2"
          >
            <div className="flex items-center gap-2 rounded-full bg-white py-2 pl-5 pr-2 shadow-[0_10px_30px_rgba(27,20,51,0.12)]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder={dictation.listening ? dictation.heard || "Listening… release to send" : `Ask about ${active.name}…`}
                aria-label="Your question"
                enterKeyHint="send"
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-night-soft/70"
              />
              {dictation.supported && !input.trim() ? (
                <motion.button
                  type="button"
                  aria-label={dictation.listening ? "Listening: release to send" : "Hold to talk"}
                  disabled={busy}
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    dictation.start();
                  }}
                  onPointerUp={dictation.stop}
                  onPointerLeave={() => dictation.listening && dictation.stop()}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`grid h-11 w-11 flex-none touch-none select-none place-items-center rounded-full transition-colors disabled:opacity-30 ${dictation.listening ? "bg-candy text-night" : "bg-lilac-soft text-night"}`}
                >
                  <Mic />
                </motion.button>
              ) : null}
              <motion.button
                type="submit"
                aria-label="Send"
                disabled={busy || !input.trim()}
                whileTap={{ scale: 0.9 }}
                className="grid h-11 w-11 flex-none place-items-center rounded-full bg-night text-white transition-opacity disabled:opacity-30"
              >
                <Arrow />
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
