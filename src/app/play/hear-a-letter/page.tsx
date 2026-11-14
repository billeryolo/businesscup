"use client";

import { GamePage } from "@/components/games/bits";
import { HearALetter } from "@/components/games/hear-a-letter";

export default function HearALetterPage() {
  return <GamePage>{(kid, exit) => <HearALetter key={kid.id} kid={kid} onExit={exit} />}</GamePage>;
}
