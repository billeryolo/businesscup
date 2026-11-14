"use client";

import { BigWord } from "@/components/games/big-word";
import { GamePage } from "@/components/games/bits";

export default function BigWordPage() {
  return <GamePage>{(kid, exit) => <BigWord key={kid.id} kid={kid} onExit={exit} />}</GamePage>;
}
