"use client";

// Learn: every game in the app, grouped by skill. The ones in today's plan are marked, and a
// card opens its game in kid mode.

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AvatarBubble } from "@/components/avatars/animal";
import { ScreenHeader, Stagger } from "@/components/app/screen";
import { Icon } from "@/components/icons";
import { quickLevel } from "@/lib/checks/quick";
import { type Activity, GAMES, SECTIONS, todayFor } from "@/lib/plan/today";
import { gradeLabel, type Kid, useFamily } from "@/lib/store/family";

type Game = Omit<Activity, "minutes">;

function GameCard({
  game,
  kid,
  minutes,
}: {
  game: Game;
  kid: Kid;
  minutes: number | undefined;
}) {
  // Speed math plays at the child's level, so say which one.
  const level =
    game.id === "speed-math" ? quickLevel("math", kid.grade).label : null;
  const body = (
    <>
      <span
        className={`grid h-16 w-16 flex-none place-items-center rounded-[22px] ${game.tone}`}
      >
        <Icon name={game.icon} size={38} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold leading-tight">
            {game.title}
          </span>
          {minutes ? (
            <span className="rounded-full bg-night px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Today · {minutes} min
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[13px] leading-snug text-night-soft">
          {game.blurb}
        </span>
        {level ? (
          <span className="mt-1 block text-[13px] font-medium">
            For {kid.name}: {level}
          </span>
        ) : null}
      </span>
      {game.ready ? (
        <span
          className="grid h-11 w-11 flex-none place-items-center rounded-full bg-night text-white"
          aria-hidden="true"
        >
          <Icon name="play" size={16} />
        </span>
      ) : (
        <span className="flex-none rounded-full bg-mist px-3 py-1.5 text-xs font-semibold text-night-soft">
          Soon
        </span>
      )}
    </>
  );
  const shell =
    "flex items-center gap-4 rounded-[28px] bg-white p-4 shadow-[0_6px_20px_rgba(27,20,51,0.06)]";
  if (!game.ready) return <div className={`${shell} opacity-70`}>{body}</div>;
  return (
    <motion.div whileTap={{ scale: 0.97 }}>
      <Link
        href={`/play/${game.id}`}
        aria-label={`Play ${game.title}`}
        className={shell}
      >
        {body}
      </Link>
    </motion.div>
  );
}

// The 1-minute check sits above the games: it is how a parent sees where the child is today.
function CheckCard({ kid }: { kid: Kid }) {
  return (
    <section>
      <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-night-soft">
        Check
      </h2>
      <motion.div whileTap={{ scale: 0.97 }}>
        <Link
          href="/checkup"
          aria-label="Start the 1-minute reading check"
          className="flex items-center gap-4 rounded-[28px] bg-white p-4 shadow-[0_6px_20px_rgba(27,20,51,0.06)]"
        >
          <span className="grid h-16 w-16 flex-none place-items-center rounded-[22px] bg-lilac">
            <Icon name="book" size={38} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[17px] font-semibold leading-tight">
                1-minute reading check
              </span>
              <span className="rounded-full bg-night px-2.5 py-0.5 text-[11px] font-semibold text-white">
                1 min
              </span>
            </span>
            <span className="mt-1 block text-[13px] leading-snug text-night-soft">
              {kid.name} reads a short story out loud. We count the words read
              correctly.
            </span>
          </span>
          <span
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-night text-white"
            aria-hidden="true"
          >
            <Icon name="play" size={16} />
          </span>
        </Link>
      </motion.div>
    </section>
  );
}

export default function LearnPage() {
  const router = useRouter();
  const { ready, active: kid } = useFamily();
  useEffect(() => {
    if (ready && !kid) router.replace("/welcome");
  }, [ready, kid, router]);
  if (!kid) return null;

  const today = new Map(todayFor(kid).map((a) => [a.id, a.minutes]));
  const games = Object.values(GAMES);

  return (
    <>
      <ScreenHeader
        title="Learn"
        subtitle={`Games for ${kid.name} · ${gradeLabel(kid.grade)}`}
        right={<AvatarBubble animal={kid.avatar} size={52} mood="happy" />}
      />
      <Stagger className="grid gap-6">
        {[
          <CheckCard key="check" kid={kid} />,
          ...SECTIONS.map((section) => (
            <section key={section}>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-night-soft">
                {section}
              </h2>
              <div className="grid gap-3">
                {games
                  .filter((g) => g.section === section)
                  .map((g) => (
                    <GameCard
                      key={g.id}
                      game={g}
                      kid={kid}
                      minutes={today.get(g.id)}
                    />
                  ))}
              </div>
            </section>
          )),
        ]}
      </Stagger>
    </>
  );
}
