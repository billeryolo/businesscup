# Setup: Vercel and Modal

About 15 minutes. There is no database and no account system: the family's data lives on the
phone, so the app works with no settings at all. The settings below turn on the speech service,
ReadBuddy's voice and the AI.

## 1. Deploy on Vercel

1. <https://vercel.com/new> → import **billeryolo/businesscup**.
2. **Root Directory**: leave it as the repo root (Framework: Next.js is detected).
3. **Deploy.** The production branch is `main`, so every merge to it redeploys, and every PR gets
   a preview link.
4. On the free plan, Vercel only builds commits whose author email is linked to your GitHub
   account.

## 2. Speech service and voice (Modal)

Follow [`speech/README.md`](../speech/README.md). It deploys both services and prints two URLs.

## 3. Environment variables

Vercel → Project → Settings → Environment Variables (Production and Preview), then redeploy:

| Name | What it turns on |
|---|---|
| `SPEECH_URL` | "The app listens": wav2vec2 + Whisper scoring of the reading check |
| `VOICE_URL` | ReadBuddy's voice for stories and anything without a pre-made clip |
| `SPEECH_TOKEN` | The shared secret for both Modal services |
| `DEEPSEEK_API_KEY` | AI stories, the parent summary and the assistant |
| `ANTHROPIC_API_KEY` | Optional fallback AI if DeepSeek fails |
| `CONTACT_EMAIL` | Optional, shown on the privacy and terms pages |

Without any of them: the browser's own recognizer listens, the games use pre-made clips, other
speech uses the phone's voice, and built-in rules write the text.

## 4. Check it end to end

On a phone (Chrome on Android, Safari on iPhone):

1. "Try with a demo family" → Home shows Mia's 4-week path on check day.
2. A reading check with "The app listens", reading with a few mistakes → orange or red words on
   "Check the scoring", then the result.
3. Hear a letter and a story → ReadBuddy's voice; Home says "Done for today".
4. Progress → Report for the teacher → Print or share.
5. The assistant answers a question with the child's real numbers.

## Demo day

Keep both Modal services warm during judging (about $1.20 an hour together):

```bash
MIN_CONTAINERS=1 python -m modal deploy speech/app.py
```

Afterwards, redeploy without `MIN_CONTAINERS=1` so they sleep again.
