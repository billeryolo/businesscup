"use client";

import { GamePage } from "@/components/games/bits";
import { SpeedMath } from "@/components/games/speed-math";

export default function SpeedMathPage() {
  return <GamePage>{(kid, exit) => <SpeedMath key={kid.id} kid={kid} onExit={exit} />}</GamePage>;
}
