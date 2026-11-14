// Syllable splits for the words in the stories, for the practice view that shows words in parts
// (sun·flow·ers). Hand-checked against dictionary divisions, because hyphenation rules for
// typesetting split words differently from how children are taught to sound them out.
// Words not listed are shown whole; a test checks that every multi-syllable story word is here.

const DICTIONARY = `
A·na a·bout a·bove a·cross add·ed ad·mit af·ter af·ter·noon a·gain al·most a·long al·so al·ways an·i·mals
an·oth·er an·y an·y·one an·y·thing ap·ples a·round ar·row a·sleep Au·gust a·way back·yard bare·ly
bark·ing bat·ter be·cause be·fore be·gan be·hind be·low ber·ries bet·ter be·tween big·ger bis·cuit
bod·y book·shelf bot·tle boun·ces brace·let branch·es break·fast bridg·es broth·er buck·et buck·ets
bus·i·est bus·y but·ter but·ter·flies cab·in camp·fire Can·a·da care·ful·ly car·ried car·ri·er
car·ries car·rot car·ry cat·er·pil·lars cen·ti·me·ter chang·ing chas·ing check·ing chil·dren
chirp·ing choc·o·late clev·er close·ly co·coa col·ored com·ing com·pass con·test count·ed cov·er
crick·ets cub·bies cub·by dan·gers Dan·iel day·time de·cid·ed de·tec·tive dif·fer·ent di·rec·tion
dis·cov·er·y dis·play dol·lars drag·ons drift·ed drive·way dur·ing east·ern eas·i·er E·le·na
e·lev·en emp·ty e·nough E·than e·ven ev·er ev·er·y ev·er·y·one ev·er·y·thing ex·pect·ed fam·i·lies
fam·i·ly fe·males few·er fif·ty fi·nal·ly fin·gers fin·ished fire·flies fish·ing flash·light
flow·er flow·ers fly·ing for·ests for·get fro·zen fun·ny ga·rage gar·den gar·dens
gath·er gath·ered gent·ly giv·ing glu·ing gold·en grad·ers grand·chil·dren grand·moth·er grand·pa
gra·no·la hap·pened hap·py hard·er heat·ed heav·i·er help·er high·est hon·ey hon·ey·bees
hon·ey·comb hun·dred hun·gry i·de·a im·pressed in·sect in·sects in·side in·stead in·to Ja·mal
jan·i·tor Jor·dan jour·nal judg·es kitch·en land·ed lat·er lay·er lem·on·ade lem·ons Le·o
li·brar·y Lil·y lis·ten lit·tle lon·ger lon·gest luck·y lunch·es man·y Mar·cus Ma·ya may·be
meas·ur·ing Mex·i·co Mi·a mid·dle milk·weed mil·lions min·utes miss·ing mis·take mo·ment mon·arch
mon·archs mon·ey moon·flow·ers morn·ing moun·tain moun·tains mov·ing muf·fin near·ly nec·tar
ner·vous nev·er Ni·a no·bod·y No·ra note·book noth·ing no·ticed o·kay old·est O·liv·i·a on·ly
on·to o·pen o·pen·ing or·ange oth·er oth·ers out·side o·ver o·ver·night pan·cake pan·cakes pa·per
pat·tern pea·nut pen·cil peo·ple Pep·per pet·als pic·ture pil·low pi·rates pitch·er plas·tic
point·ed pol·len post·er post·ers press·es pret·zels Pri·ya prom·ised pump·kins pup·py qui·et·ly
read·ing read·y real·ly re·cess rec·i·pe re·mind·ed rib·bon ris·ing Riv·er·side rock·ets Ro·sa
rub·ber rul·er sand·wich Sat·ur·day sci·ence sci·en·tists scratch·ing sec·ond se·cret set·ting
side·ways sil·ver sim·ple sin·gle sis·ter sleep·ing slow·ly snow·man soc·cer So·fi·a sol·id
some·one some·thing some·times spe·cial squir·rel start·ed sta·tion steal·ing stick·y sto·ries strong·er
sud·den·ly sug·ar sug·gest·ed sum·mer sun·flow·ers sup·plies ta·ble ta·bles teach·er
tem·per·a·ture ten·nis thou·sand thou·sands ti·ny ti·tle to·day to·geth·er to·ma·toes to·ward
tri·an·gles twen·ty twist·ed um·brel·las un·der un·der·neath un·fold·ed U·nit·ed un·locked un·til
up·side us·es u·su·al·ly ver·y vis·its vol·ca·no wait·ed want·ed wa·ter weath·er week·end
whis·pered win·dow win·ner win·ter with·in with·out won·der wood·en work·er work·ers wrap·pers
yel·low
`;

const SYLLABLES = new Map<string, number[]>();
for (const entry of DICTIONARY.split(/\s+/).filter(Boolean)) {
  const parts = entry.toLowerCase().split("·");
  SYLLABLES.set(parts.join(""), parts.map((p) => p.length));
}

const letters = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Letter counts of each syllable, or null for one-syllable and unknown words. */
function lookup(core: string): number[] | null {
  const key = letters(core);
  const found = SYLLABLES.get(key);
  if (found) return found;
  // "Maya's", "won't": the ending joins the last syllable of the base word.
  const base = core.toLowerCase().match(/^[^a-z]*([a-z]+)['’][a-z]+[^a-z]*$/)?.[1];
  const parts = base ? SYLLABLES.get(base) : undefined;
  return parts ? [...parts.slice(0, -1), parts[parts.length - 1] + key.length - base!.length] : null;
}

/**
 * Splits a word as shown in the story into syllables, keeping its capitals and punctuation:
 * "Maya's," → ["Ma", "ya's,"]. One-syllable words come back whole.
 */
export function syllabify(display: string): string[] {
  // Hyphenated words split at the hyphen first; the hyphen stays with the left part.
  const pieces = display.split(/(?<=[-–])/);
  return pieces.flatMap((piece) => {
    const counts = lookup(piece);
    if (!counts || counts.length < 2) return [piece];
    const out: string[] = [];
    let seen = 0;
    let start = 0;
    let cut = counts[0];
    let next = 1;
    for (let i = 0; i < piece.length && next < counts.length; i++) {
      if (!/[a-z]/i.test(piece[i])) continue;
      seen++;
      if (seen === cut) {
        out.push(piece.slice(start, i + 1));
        start = i + 1;
        cut += counts[next++];
      }
    }
    out.push(piece.slice(start));
    return out;
  });
}

/** True when the word is in the syllable list (for tests). */
export function hasSyllables(word: string): boolean {
  return SYLLABLES.has(letters(word));
}
