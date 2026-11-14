"use client";

// Story about…, the game: pick what you love, get a short story about it with you as the hero,
// read it page by page (or have it read to you), then answer two questions. One star for
// reading to the end, one for each question answered right on the first try.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimalBuddy } from "@/components/avatars/buddy";
import { Icon } from "@/components/icons";
import { clay } from "@/components/kid/stage";
import { cleanInterest, fillChild, INTEREST_MAX, INTEREST_MIN, LIBRARY_VARIANTS, libraryStory, mixChoices, type Story, storyFits, StoryShape, TOPICS } from "@/lib/games/story";
import { hush, say } from "@/lib/speech/say";
import { familyActions, type Kid } from "@/lib/store/family";
import { BackButton, chunky, chunkyDark, GameDone, GameIntro, GameTop } from "./bits";
import { TopicIcon } from "./story-icons";

const Speaker = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M4 9.500h3.200L12 5.500v13l-4.800-4H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor" stroke="currentColor" strokeWidth="1.600" strokeLinejoin="round" />
    <path d="M15.500 9a4.200 4.200 0 0 1 0 6M18 6.500a7.800 7.800 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" />
  </svg>
);

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Asks the server for a story; any trouble at all and a built-in one is used instead. */
async function getStory(interest: string, kid: Kid): Promise<Story> {
  const variant = Math.floor(Math.random() * LIBRARY_VARIANTS);
  let story: Story = libraryStory(interest, kid.grade, variant);
  try {
    const response = await fetch("/api/ai/story", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ interest, grade: kid.grade, variant }),
      signal: AbortSignal.timeout(25_000),
    });
    const body: unknown = response.ok ? await response.json() : null;
    const parsed = StoryShape.safeParse(body);
    if (parsed.success && storyFits(parsed.data)) story = { ...parsed.data, source: (body as { source?: string }).source === "ai" ? "ai" : "library" };
  } catch {
    // Offline or too slow: the built-in story is already in hand.
  }
  return mixChoices(fillChild(story, kid.name));
}

type Stage = "intro" | "pick" | "making" | "read" | "ask" | "done";

export function StoryGame({ kid, onExit }: { kid: Kid; onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [about, setAbout] = useState("");
  const [story, setStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const [ask, setAsk] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState(false);
  const [stars, setStars] = useState(0);
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      pending.forEach(clearTimeout);
      hush();
    };
  }, []);

  // The youngest cannot read yet, so every page and question is read out for them.
  const readAloud = kid.grade <= 0;

  function pick() {
    setStage("pick");
    setTyping(false);
    setTyped("");
    setStory(null);
    setStars(0);
  }

  async function make(raw: string) {
    const interest = cleanInterest(raw).toLowerCase();
    if (interest.length < INTEREST_MIN) return;
    setAbout(interest);
    setStage("making");
    say(`A story about ${interest}!`);
    const [made] = await Promise.all([getStory(interest, kid), wait(1600)]);
    if (!alive.current) return;
    setStory(made);
    setPage(0);
    setAsk(0);
    setWrong([]);
    setRight(false);
    setStage("read");
    if (readAloud) say(`${made.title}. ${made.pages[0]}`);
  }

  function nextPage(made: Story) {
    if (page + 1 < made.pages.length) {
      setPage(page + 1);
      if (readAloud) say(made.pages[page + 1]);
      else hush();
      return;
    }
    setStars(1);
    setStage("ask");
    if (readAloud) say(made.questions[0].q);
    else hush();
  }

  function answer(choice: number, made: Story) {
    const q = made.questions[ask];
    if (right || wrong.includes(choice)) return;
    if (choice !== q.answer) {
      setWrong([...wrong, choice]);
      return;
    }
    const total = stars + (wrong.length === 0 ? 1 : 0);
    setRight(true);
    setStars(total);
    later(() => {
      setWrong([]);
      setRight(false);
      if (ask + 1 < made.questions.length) {
        setAsk(ask + 1);
        if (readAloud) say(made.questions[ask + 1].q);
        return;
      }
      setStage("done");
      familyActions.updateKid(kid.id, { stars: kid.stars + total });
    }, 1300);
  }

  if (stage === "intro") return <GameIntro kid={kid} title="Story about…" line="Pick what you love and I’ll tell a story about it!" onGo={pick} onExit={onExit} />;

  if (stage === "pick") {
    const ok = cleanInterest(typed).length >= INTEREST_MIN;
    return (
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <BackButton onClick={onExit} />
          <h1 className="text-[26px] font-semibold leading-none">A story about…</h1>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {TOPICS.map((topic, i) => (
            <motion.button
              key={topic.id}
              type="button"
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 24, delay: i * 0.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => make(topic.interest)}
              className={`grid h-[124px] place-items-center content-center gap-1 text-xl ${topic.tone} ${chunky}`}
            >
              <span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white/75">
                <TopicIcon topic={topic.id} size={56} />
              </span>
              {topic.label}
            </motion.button>
          ))}
        </div>

        <div className="mt-3">
          {typing ? (
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={(event) => {
                event.preventDefault();
                make(typed);
              }}
              className={`flex items-center gap-2 bg-white p-2 pl-5 ${chunky}`}
            >
              <input
                autoFocus
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                maxLength={INTEREST_MAX}
                placeholder="trains, unicorns, soccer…"
                aria-label="What should the story be about?"
                enterKeyHint="go"
                className="h-12 min-w-0 flex-1 bg-transparent text-xl font-medium outline-none placeholder:text-night/35"
              />
              <motion.button type="submit" disabled={!ok} whileTap={{ scale: 0.92 }} aria-label="Make my story" className={`grid h-12 w-12 flex-none place-items-center rounded-full bg-night text-white transition-opacity ${ok ? "" : "opacity-30"}`}>
                <Icon name="play" size={20} />
              </motion.button>
            </motion.form>
          ) : (
            <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setTyping(true)} className={`flex h-[68px] w-full items-center justify-center gap-2 bg-white text-xl ${chunky}`}>
              <Icon name="wand" size={30} /> Something else
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  if (stage === "making" || !story) {
    return (
      <div className="relative grid flex-1 content-center justify-items-center gap-4 text-center" role="status">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <AnimalBuddy animal={kid.avatar} size={170} mood="happy" />
        </motion.div>
        <div className="relative grid h-[92px] w-[92px] place-items-center rounded-full bg-white/80">
          <motion.div animate={{ rotate: [-14, 14, -14] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
            <Icon name="wand" size={54} />
          </motion.div>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ left: `${[-8, 78, 40][i]}px`, top: `${[6, 2, -22][i]}px` }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35 }}
            >
              <Icon name="star" size={22} />
            </motion.span>
          ))}
        </div>
        <p className="text-[26px] font-semibold leading-tight">Making your story…</p>
        <p className="max-w-[260px] text-lg font-medium text-night/70">A story about {about}, just for {kid.name}.</p>
      </div>
    );
  }

  if (stage === "done") {
    const total = story.questions.length + 1;
    return <GameDone kid={kid} stars={stars} total={total} line={`You read “${story.title}”`} onAgain={pick} onExit={onExit} />;
  }

  const steps = story.pages.length + story.questions.length;
  const reading = stage === "read";
  const text = story.pages[page];
  const size = text.length <= 40 ? "text-center text-[36px] leading-[1.25]" : text.length <= 100 ? "text-[28px] leading-[1.3]" : "text-[23px] leading-[1.4]";
  const q = story.questions[ask];

  return (
    <div className="relative flex flex-1 flex-col">
      <GameTop onExit={onExit} total={steps} done={reading ? page : story.pages.length + ask + (right ? 1 : 0)} stars={stars} />

      <div className="mt-3 flex items-end justify-between gap-3">
        <AnimalBuddy animal={kid.avatar} size={104} mood={right ? "cheer" : wrong.length ? "oops" : "happy"} />
        <p className="mb-3 flex-1 rounded-[22px] rounded-bl-md bg-white/85 px-4 py-3 text-lg font-semibold leading-tight">{reading ? story.title : "What do you remember?"}</p>
      </div>

      <div className="relative mt-2 grid min-h-[230px] flex-1 overflow-hidden rounded-[36px] bg-white shadow-[0_8px_20px_rgba(27,20,51,0.08)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={reading ? `p${page}` : `q${ask}`}
            aria-live="polite"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="grid content-center gap-4 p-6"
          >
            {reading ? (
              <p className={`font-read font-medium text-night ${size}`}>{text}</p>
            ) : (
              <p className="text-center text-[28px] font-semibold leading-tight">{q.q}</p>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => say(reading ? text : q.q)}
              className={`flex h-12 items-center gap-2 justify-self-center rounded-full bg-gradient-to-b from-[#b9aef7] to-[#8f7dea] px-5 text-base font-medium text-white ${clay}`}
            >
              <Speaker className="h-6 w-6" />
              Read to me
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      {reading ? (
        <div className="mt-5 grid min-h-[72px]">
          <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => nextPage(story)} className={`h-[72px] text-2xl ${chunkyDark}`}>
            {page + 1 < story.pages.length ? "Next page" : "The end!"}
          </motion.button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {q.choices.map((choice, i) => {
            const isWrong = wrong.includes(i);
            const isRight = right && i === q.answer;
            return (
              <motion.button
                key={`${ask}-${i}`}
                type="button"
                disabled={isWrong || right}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isWrong ? 0.45 : 1, y: 0, x: isWrong ? [0, -9, 9, -6, 6, 0] : 0, scale: isRight ? 1.04 : 1 }}
                transition={{ duration: 0.3, delay: isWrong || isRight ? 0 : i * 0.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => answer(i, story)}
                className={`flex min-h-[64px] items-center justify-center gap-2 px-5 py-2 text-xl leading-tight transition-colors ${chunky} ${isRight ? "bg-mint" : isWrong ? "bg-candy/60" : "bg-white"}`}
              >
                {isRight ? <Icon name="check" size={24} /> : null}
                {choice}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
