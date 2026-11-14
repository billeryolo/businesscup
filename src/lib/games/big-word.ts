// Big word: a long word arrives in pieces and the child taps the pieces in order to build it,
// then reads it whole. Two-part words up to grade 1, three and four parts after.

import { shuffled } from "@/lib/checks/quick";
import type { Grade } from "@/lib/store/family";

export type WordItem = {
  word: string;
  parts: string[];
  /** The parts and one piece from another word, in random order. */
  tiles: string[];
};

export const WORD_ROUND = 6;

// Split the way children are taught to sound words out, not the way typesetters hyphenate.
const SHORT =
  "gar·den pup·py win·dow yel·low sum·mer win·ter pen·cil sis·ter flow·er rab·bit bas·ket pic·nic nap·kin mit·ten kit·ten pump·kin rock·et muf·fin but·ter pil·low sil·ver ta·ble wa·ter ti·ger ro·bot mu·sic ba·by pa·per ze·bra mon·key";
const LONG =
  "but·ter·fly sun·flow·er af·ter·noon an·i·mal choc·o·late de·tec·tive to·geth·er um·brel·la vol·ca·no grand·moth·er lem·on·ade hon·ey·bee to·ma·to ba·nan·a el·e·phant di·no·saur oc·to·pus kan·ga·roo cat·er·pil·lar wa·ter·mel·on tem·per·a·ture dis·cov·er·y al·li·ga·tor hel·i·cop·ter";

const split = (list: string) => list.split(" ").map((w) => w.split("·"));

export function makeWordRound(grade: Grade, rand: () => number = Math.random, count = WORD_ROUND): WordItem[] {
  const pool = split(grade <= 1 ? SHORT : LONG);
  const picked = shuffled(pool, rand).slice(0, count);
  return picked.map((parts) => {
    // One piece that does not belong, so the last tap is still a choice.
    const extras = pool.flat().filter((p) => !parts.includes(p));
    const extra = extras[Math.floor(rand() * extras.length)];
    return { word: parts.join(""), parts, tiles: shuffled([...parts, extra], rand) };
  });
}
