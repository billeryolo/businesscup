"use client";

import { GamePage } from "@/components/games/bits";
import { StoryGame } from "@/components/games/story";

export default function StoryPage() {
  return <GamePage>{(kid, exit) => <StoryGame key={kid.id} kid={kid} onExit={exit} />}</GamePage>;
}
