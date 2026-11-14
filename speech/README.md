# Speech and voice services (Modal)

`speech/app.py` deploys two services in one Modal app:

- **Speech** (GPU): "the app listens" in the reading check.
- **Voice** (CPU): ReadBuddy's voice, Kokoro-82M text-to-speech (Apache 2.0).

## Voice

The games call `say()` as before (`src/lib/speech/say.ts`). It now tries, in order:

1. a **pre-made clip** from `public/audio/` (listed in `src/lib/speech/clips.json`): every letter line,
   every "Yes! A!" cheer and every Big word. Instant and offline.
2. the **live voice**, `/api/speak` → the Voice service, for stories and anything new. About 3–5 s
   per sentence; the story game fetches the next pages while the first one plays.
3. the **phone's own voice**, if neither answers.

After changing a game's word list or the voice, regenerate the clips (reads `.env.local`):

```bash
python speech/make_clips.py
```

`src/lib/speech/voice.test.ts` fails when a game line has no clip.

## Speech

Two models hear the same recording on one T4 GPU:

- **wav2vec2-large**: no language model, so it writes what it hears ("hose" for "horse"). It catches
  the most real misreadings but also flags some correct words.
- **Whisper small.en**: it writes likely words, so it rarely flags a correct word, but it "fixes"
  real mistakes.

`/api/transcribe` aligns both against the passage. Words both models agree on are decided
automatically; words they disagree on come back as `check` for the parent to confirm
(`src/lib/speech/merge.ts`). The audio is never stored.

## Set up (about 10 minutes, once)

1. Make a Modal account at <https://modal.com> (the Starter plan includes $30 of credit each month).
2. Install the CLI and log in:

   ```bash
   python -m pip install modal
   python -m modal setup
   ```

3. Make a long random token, and store it as a Modal secret:

   ```bash
   python -m modal secret create readcheck-speech STT_TOKEN=<the token>
   ```

4. Deploy from the repo root. The first deploy downloads both models into the image (a few minutes):

   ```bash
   python -m modal deploy speech/app.py
   ```

   It prints two URLs, `…-speech-web.modal.run` and `…-voice-web.modal.run`.

5. Put both URLs and the same token in `.env.local`, and in Vercel → Settings → Environment Variables:

   ```
   SPEECH_URL=https://<workspace>--readcheck-speech-speech-web.modal.run
   VOICE_URL=https://<workspace>--readcheck-speech-voice-web.modal.run
   SPEECH_TOKEN=<the token>
   ```

6. Open `/dev/speech`, record or upload a reading, and check the colours.

## Demo day

Both services sleep after 5 minutes without a request, and waking takes a little while. For the
judging window, keep one of each warm (the T4 costs about $0.59 an hour; the voice's 2 CPUs much
less):

```bash
MIN_CONTAINERS=1 python -m modal deploy speech/app.py
```

On Windows PowerShell: `$env:MIN_CONTAINERS=1; python -m modal deploy speech/app.py`.
Redeploy without it afterwards so it stops costing money.

The reading screen should also call `warmSpeech()` when it opens, so the GPU is starting while the
child gets ready.

## If it fails

`/api/transcribe` answers 503 when the service isn't configured, doesn't answer in 25 seconds, or
errors. `transcribeReading()` then returns `null`, and the screen switches to "I'll mark it myself"
with the same text.
