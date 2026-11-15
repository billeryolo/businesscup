"""Pre-makes ReadBuddy's voice for every fixed line the games say, so they play instantly.

Reads the game word lists from the TypeScript sources, asks the Voice service (speech/app.py) for
each line, and writes public/audio/<hash>.mp3 plus src/lib/speech/clips.json (line -> file).
Run again after changing a word list or the voice; existing clips are kept unless --force.

    python speech/make_clips.py            (reads VOICE_URL and SPEECH_TOKEN from .env.local)

The test in src/lib/speech/voice.test.ts fails if a game line has no clip.
"""

import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "lib" / "speech" / "clips.json"


def env() -> dict[str, str]:
    values = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            values[k.strip()] = v.strip()
    return values


def game_lines() -> list[str]:
    letters_src = (ROOT / "src/lib/games/hear-a-letter.ts").read_text(encoding="utf-8")
    words_block = re.search(r"const WORDS: Record<string, string> = \{(.*?)\};", letters_src, re.S).group(1)
    letter_words = dict(re.findall(r'(\w):\s*"([^"]+)"', words_block))
    big_src = (ROOT / "src/lib/games/big-word.ts").read_text(encoding="utf-8")
    big = []
    for name in ("SHORT", "LONG"):
        block = re.search(rf"const {name} =\s*\"([^\"]+)\"", big_src).group(1)
        big += [w.replace("·", "") for w in block.split()]

    lines = []
    for letter, word in letter_words.items():
        lines.append(f"{letter} is for {word}.")  # letterLine() in hear-a-letter.ts
        lines.append(f"Yes! {letter}!")  # the cheer in hear-a-letter.tsx
    lines += big  # each Big word, said whole
    lines.append("Voice is on")  # the Family tab, when the voice is switched on
    story_src = (ROOT / "src/lib/games/story.ts").read_text(encoding="utf-8")
    for interest in re.findall(r'interest: "([^"]+)"', story_src):
        lines.append(f"A story about {interest}!")  # story.tsx, while a picked-topic story is made
    return lines


# Letter lines are said slower, so a young child hears the letter clearly.
LETTER_LINE = re.compile(r"^[A-Z] is for \w+\.$")
SLOW = 0.75


def clip_name(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12] + ".mp3"


def main() -> None:
    force = "--force" in sys.argv
    cfg = env()
    url, token = cfg["VOICE_URL"].rstrip("/"), cfg["SPEECH_TOKEN"]
    OUT.mkdir(parents=True, exist_ok=True)

    # A short silence, played on the first tap to unlock audio on phones.
    silence = OUT / "silence.mp3"
    if not silence.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.15", "-b:a", "32k", str(silence)], check=True)

    lines = game_lines()

    def fetch(text: str) -> tuple[str, str]:
        name = clip_name(text)
        path = OUT / name
        if force or not path.exists():
            req = urllib.request.Request(
                f"{url}/speak",
                data=json.dumps({"text": text, **({"speed": SLOW} if LETTER_LINE.match(text) else {})}).encode(),
                headers={"authorization": f"Bearer {token}", "content-type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=300) as res:
                path.write_bytes(res.read())
        return text, f"/audio/{name}"

    with ThreadPoolExecutor(max_workers=6) as pool:
        manifest = dict(pool.map(fetch, lines))

    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    size = sum((OUT / Path(p).name).stat().st_size for p in manifest.values())
    print(f"{len(manifest)} clips, {size // 1024} KB, manifest: {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
