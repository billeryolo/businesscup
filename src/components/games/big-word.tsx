"use client";

// Big word, the game: tap the pieces in order to build the word, then read it whole. A piece in
// the wrong place wobbles back; a star is for building the word with no slips.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { clay } from "@/components/kid/stage";
import { makeWordRound, type WordItem } from "@/lib/games/big-word";
import { hush, say } from "@/lib/speech/say";
import { familyActions, type Kid } from "@/lib/store/family";
import { chunky, GameDone, GameIntro, GameTop } from "./bits";

export function BigWord({ kid, onExit }: { kid: Kid; onExit: () => void }) {
  const [round, setRound] = useState<WordItem[] | null>(null);
  const [index, setIndex] = useState(0);
  /** Tile positions already placed, in order. */
  const [used, setUsed] = useState<number[]>([]);
  const [wobble, setWobble] = useState<number | null>(null);
  const [slipped, setSlipped] = useState(false);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      hush();
    },
    [],
  );

  function begin() {
    const next = makeWordRound(kid.grade);
    setRound(next);
    setIndex(0);
    setUsed([]);
    setSlipped(false);
    setStars(0);
    setDone(false);
    say(next[0].word);
  }

  function tap(tile: number, item: WordItem, items: WordItem[]) {
    if (used.length >= item.parts.length || used.includes(tile)) return;
    if (item.tiles[tile] !== item.parts[used.length]) {
      setSlipped(true);
      setWobble(tile);
      later(() => setWobble(null), 500);
      return;
    }
    const placed = [...used, tile];
    setUsed(placed);
    if (placed.length < item.parts.length) return;

    const total = stars + (slipped ? 0 : 1);
    setStars(total);
    say(item.word);
    later(() => {
      setUsed([]);
      setSlipped(false);
      if (index + 1 < items.length) {
        setIndex(index + 1);
        say(items[index + 1].word);
        return;
      }
      setDone(true);
      if (total > 0) familyActions.updateKid(kid.id, { stars: kid.stars + total });
    }, 2200);
  }

  if (!round) return <GameIntro kid={kid} title="Big word" line="Put the pieces in order to build the word!" onGo={begin} onExit={onExit} />;
  if (done) return <GameDone kid={kid} stars={stars} total={round.length} line={`${stars} of ${round.length} built with no slips`} onAgain={begin} onExit={onExit} />;

  const item = round[index];
  const built = used.length === item.parts.length;
  const size = item.word.length > 9 ? "text-[30px]" : item.word.length > 6 ? "text-[38px]" : "text-[46px]";

  return (
    <div className="relative flex flex-1 flex-col">
      <GameTop onExit={onExit} total={round.length} done={index + (built ? 1 : 0)} stars={stars} />

      <div className="mt-4 flex justify-center">
        <AnimalBuddy animal={kid.avatar} size={132} mood={built ? "cheer" : wobble !== null ? "oops" : "happy"} />
      </div>

      <div className="relative mt-2 grid min-h-[200px] flex-1 place-items-center overflow-hidden rounded-[36px] bg-white shadow-[0_8px_20px_rgba(27,20,51,0.08)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${index}-${built}`}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 480, damping: 26 }}
            className="grid justify-items-center gap-4 p-4 text-center"
          >
            {built ? (
              <>
                <p className={`font-semibold leading-none ${item.word.length > 9 ? "text-[44px]" : "text-[56px]"}`} aria-label={item.word}>
                  {item.parts.map((part, i) => (
                    <span key={i} className={i % 2 ? "text-[#7B67E0]" : "text-[#23936A]"}>
                      {part}
                    </span>
                  ))}
                </p>
                <p className="text-xl font-medium text-night/70">Now read it out loud!</p>
              </>
            ) : (
              <>
                <div className={`flex flex-wrap items-center justify-center gap-2 font-semibold ${size}`} aria-label={`${used.length} of ${item.parts.length} pieces placed`}>
                  {item.parts.map((part, i) => {
                    const filled = i < used.length;
                    return (
                      <span
                        key={i}
                        style={{ minWidth: `${part.length * 0.62 + 0.7}em` }}
                        className={`grid h-[1.7em] place-items-center rounded-2xl px-2 leading-none transition-colors ${
                          filled ? "bg-mint/70" : i === used.length ? "border-[3px] border-dashed border-lilac bg-lilac-soft" : "border-[3px] border-dashed border-night/15"
                        }`}
                      >
                        {filled ? (
                          <motion.span initial={{ scale: 0.4, y: 16 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                            {part}
                          </motion.span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => say(item.word)}
                  aria-label="Hear the word"
                  className={`flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-[#b9aef7] to-[#8f7dea] px-5 text-base font-medium text-white ${clay}`}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path d="M4 9.500h3.200L12 5.500v13l-4.800-4H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="#fff" stroke="#fff" strokeWidth="1.600" strokeLinejoin="round" />
                    <path d="M15.500 9a4.200 4.200 0 0 1 0 6M18 6.500a7.800 7.800 0 0 1 0 11" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />
                  </svg>
                  Hear the word
                </motion.button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex min-h-[164px] flex-wrap content-start items-start justify-center gap-3">
        {item.tiles.map((tile, i) => {
          const gone = used.includes(i);
          return (
            <motion.button
              key={`${index}-${i}`}
              type="button"
              disabled={gone || built}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: gone ? 0 : built ? 0.35 : 1, y: 0, scale: gone ? 0.6 : 1, x: wobble === i ? [0, -9, 9, -6, 6, 0] : 0 }}
              transition={{ duration: 0.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => tap(i, item, round)}
              className={`h-[72px] min-w-[84px] bg-white px-5 text-[32px] transition-colors ${chunky} ${wobble === i ? "!bg-candy/60" : ""}`}
            >
              {tile}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
