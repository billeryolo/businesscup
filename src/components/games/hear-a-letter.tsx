"use client";

// Hear a letter, the game: the phone says a letter, the child taps it. A wrong tile wobbles and
// fades so they can try again; a star is for getting it on the first try.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { letterLine, type LetterItem, makeLetterRound } from "@/lib/games/hear-a-letter";
import { familyActions, type Kid } from "@/lib/store/family";
import { clay } from "@/components/kid/stage";
import { chunky, GameDone, GameIntro, GameTop } from "./bits";

/** Says it out loud with the phone's own voice. False when the phone has none. */
function say(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-US";
  voice.rate = 0.8;
  voice.pitch = 1.15;
  window.speechSynthesis.speak(voice);
  return true;
}

export function HearALetter({ kid, onExit }: { kid: Kid; onExit: () => void }) {
  const [round, setRound] = useState<LetterItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [oops, setOops] = useState(false);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const [voice, setVoice] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function begin() {
    const next = makeLetterRound(kid.grade);
    setRound(next);
    setIndex(0);
    setTried([]);
    setSolved(false);
    setStars(0);
    setDone(false);
    // The first sound must come straight from the tap, or phones keep it silent.
    setVoice(say(letterLine(next[0])));
  }

  function pick(choice: string, item: LetterItem, items: LetterItem[]) {
    if (solved) return;
    if (choice !== item.answer) {
      setTried([...tried, choice]);
      setOops(true);
      later(() => setOops(false), 700);
      return;
    }
    const total = stars + (tried.length === 0 ? 1 : 0);
    setSolved(true);
    setStars(total);
    say(`Yes! ${item.letter}!`);
    later(() => {
      setSolved(false);
      setTried([]);
      if (index + 1 < items.length) {
        setIndex(index + 1);
        say(letterLine(items[index + 1]));
        return;
      }
      setDone(true);
      if (total > 0) familyActions.updateKid(kid.id, { stars: kid.stars + total });
    }, 1500);
  }

  if (!round) return <GameIntro kid={kid} title="Hear a letter" line="Listen, then tap the letter you hear!" onGo={begin} onExit={onExit} />;
  if (done) return <GameDone kid={kid} stars={stars} total={round.length} line={`${stars} of ${round.length} on the first try`} onAgain={begin} onExit={onExit} />;

  const item = round[index];

  return (
    <div className="relative flex flex-1 flex-col">
      <GameTop onExit={onExit} total={round.length} done={index + (solved ? 1 : 0)} stars={stars} />

      <div className="mt-4 flex justify-center">
        <AnimalBuddy animal={kid.avatar} size={132} mood={solved ? "cheer" : oops ? "oops" : "happy"} />
      </div>

      <div className="relative mt-2 grid min-h-[190px] flex-1 place-items-center overflow-hidden rounded-[36px] bg-white shadow-[0_8px_20px_rgba(27,20,51,0.08)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${index}-${solved}`}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 480, damping: 26 }}
            className="grid justify-items-center gap-3 p-4 text-center"
          >
            {solved ? (
              <>
                <p className="text-[96px] font-semibold leading-none text-[#23936A]">{item.answer}</p>
                <p className="text-2xl font-semibold">
                  {item.letter} is for {item.word}
                </p>
              </>
            ) : (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  onClick={() => say(letterLine(item))}
                  aria-label="Hear the letter again"
                  className={`grid h-[104px] w-[104px] place-items-center rounded-full bg-gradient-to-b from-[#b9aef7] to-[#8f7dea] ${clay}`}
                >
                  <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
                    <path d="M4 9.500h3.200L12 5.500v13l-4.800-4H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="#fff" stroke="#fff" strokeWidth="1.600" strokeLinejoin="round" />
                    <path d="M15.500 9a4.200 4.200 0 0 1 0 6M18 6.500a7.800 7.800 0 0 1 0 11" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />
                  </svg>
                </motion.button>
                <p className="text-xl font-semibold text-night/70">{voice ? "Tap to hear it again" : `Find the letter for “${item.word}”`}</p>
                {voice ? null : <p className="max-w-[240px] text-sm font-medium text-night/50">This phone has no voice, so a grown-up can read the word out loud.</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={`mt-5 grid gap-3 ${item.choices.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
        {item.choices.map((choice, i) => {
          const wrong = tried.includes(choice);
          const right = solved && choice === item.answer;
          return (
            <motion.button
              key={`${index}-${choice}`}
              type="button"
              disabled={wrong}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: wrong ? 0.35 : 1, y: right ? -10 : 0, rotate: wrong ? -6 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: solved || tried.length ? 0 : i * 0.06 }}
              whileTap={solved || wrong ? undefined : { scale: 0.9 }}
              onClick={() => pick(choice, item, round)}
              aria-label={`Letter ${choice}`}
              className={`h-[92px] text-[46px] transition-colors ${chunky} ${right ? "bg-mint" : wrong ? "bg-candy/60" : "bg-white"}`}
            >
              {choice}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
