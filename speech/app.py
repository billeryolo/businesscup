"""ReadBuddy speech services on Modal.

Speech: wav2vec2 + Whisper on one GPU. One recording in, two transcripts with word timings out.
The Next.js route /api/transcribe aligns both against the passage and decides each word
(src/lib/speech/merge.ts).

Voice: Kokoro-82M text-to-speech on CPU (see the Voice class at the end). Text in, mp3 out, for
/api/speak and for the pre-made game clips (speech/make_clips.py).

- wav2vec2-large has no language model, so it writes what it hears ("hose" for "horse"):
  it catches the most real misreadings.
- Whisper writes likely words, so it rarely flags a correct word: the cautious second opinion.

The audio exists only for the length of the request (a temp file, deleted at once). Nothing is
stored or logged.

Deploy:   modal deploy speech/app.py
Demo day: MIN_CONTAINERS=1 modal deploy speech/app.py   (keeps one GPU warm, no cold start)
"""

import os
import subprocess
import tempfile
import time

import modal

W2V_MODEL = "facebook/wav2vec2-large-960h-lv60-self"
WHISPER_MODEL = "openai/whisper-small.en"
SAMPLE_RATE = 16_000
MAX_SECONDS = 80
MAX_BYTES = 8 * 1024 * 1024


def download_models():
    from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor, WhisperForConditionalGeneration, WhisperProcessor

    Wav2Vec2Processor.from_pretrained(W2V_MODEL)
    Wav2Vec2ForCTC.from_pretrained(W2V_MODEL)
    WhisperProcessor.from_pretrained(WHISPER_MODEL)
    WhisperForConditionalGeneration.from_pretrained(WHISPER_MODEL)


image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "torch==2.5.1",
        "transformers==4.46.3",
        "accelerate==1.1.1",
        "numpy==1.26.4",
        "fastapi[standard]==0.115.6",
    )
    .run_function(download_models)
)

app = modal.App("readcheck-speech", image=image)


def decode_audio(data: bytes) -> "np.ndarray":  # noqa: F821
    """Any browser recording (webm/opus, mp4/aac, ogg, wav) to 16 kHz mono float32."""
    import numpy as np

    # A temp file rather than a pipe: Safari's mp4 keeps its index at the end of the file.
    with tempfile.NamedTemporaryFile(suffix=".audio") as f:
        f.write(data)
        f.flush()
        out = subprocess.run(
            ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", f.name, "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "pipe:1"],
            capture_output=True,
            check=True,
        ).stdout
    return np.frombuffer(out, dtype=np.float32).copy()


@app.cls(
    gpu="T4",
    timeout=120,
    scaledown_window=300,
    min_containers=int(os.environ.get("MIN_CONTAINERS", "0")),
    secrets=[modal.Secret.from_name("readcheck-speech")],
)
class Speech:
    @modal.enter()
    def load(self):
        import torch
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor, pipeline

        self.torch = torch
        self.w2v_processor = Wav2Vec2Processor.from_pretrained(W2V_MODEL)
        self.w2v = Wav2Vec2ForCTC.from_pretrained(W2V_MODEL).to("cuda").half().eval()
        self.whisper = pipeline(
            "automatic-speech-recognition",
            model=WHISPER_MODEL,
            torch_dtype=torch.float16,
            device="cuda:0",
        )

    def run_wav2vec2(self, audio):
        torch = self.torch
        inputs = self.w2v_processor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt").input_values
        with torch.inference_mode():
            logits = self.w2v(inputs.to("cuda").half()).logits
        ids = torch.argmax(logits, dim=-1)[0].cpu()
        out = self.w2v_processor.decode(ids, output_word_offsets=True)
        seconds_per_frame = self.w2v.config.inputs_to_logits_ratio / SAMPLE_RATE
        words = [
            {
                "word": w["word"].lower(),
                "start": round(w["start_offset"] * seconds_per_frame, 2),
                "end": round(w["end_offset"] * seconds_per_frame, 2),
            }
            for w in out.word_offsets
        ]
        return {"text": out.text.lower(), "words": words}

    def run_whisper(self, audio):
        # No prompt with the passage: that would push Whisper further toward the "right" words.
        out = self.whisper(
            {"raw": audio, "sampling_rate": SAMPLE_RATE},
            return_timestamps="word",
            chunk_length_s=30,
            batch_size=4,
        )
        words = []
        for chunk in out.get("chunks", []):
            start, end = chunk["timestamp"]
            text = chunk["text"].strip()
            if text:
                words.append({"word": text, "start": round(start or 0, 2), "end": round(end or start or 0, 2)})
        return {"text": out["text"].strip(), "words": words}

    @modal.asgi_app()
    def web(self):
        from fastapi import FastAPI, HTTPException, Request

        api = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
        token = os.environ["STT_TOKEN"]

        def check_auth(request: Request):
            if request.headers.get("authorization") != f"Bearer {token}":
                raise HTTPException(status_code=401, detail="unauthorized")

        @api.get("/warm")
        def warm(request: Request):
            check_auth(request)
            return {"ok": True}

        @api.post("/transcribe")
        async def transcribe(request: Request):
            check_auth(request)
            data = await request.body()
            if not data:
                raise HTTPException(status_code=400, detail="empty audio")
            if len(data) > MAX_BYTES:
                raise HTTPException(status_code=413, detail="audio too large")
            started = time.perf_counter()
            try:
                audio = decode_audio(data)
            except subprocess.CalledProcessError:
                raise HTTPException(status_code=415, detail="could not read the audio")
            finally:
                del data
            seconds = len(audio) / SAMPLE_RATE
            if seconds < 1:
                raise HTTPException(status_code=400, detail="audio too short")
            if seconds > MAX_SECONDS:
                raise HTTPException(status_code=413, detail="audio too long")
            result = {
                "seconds": round(seconds, 2),
                "wav2vec2": self.run_wav2vec2(audio),
                "whisper": self.run_whisper(audio),
            }
            result["ms"] = round((time.perf_counter() - started) * 1000)
            return result

        return api


# ---------------------------------------------------------------------------------------------
# Voice: Kokoro-82M text-to-speech (Apache 2.0), on CPU
# ---------------------------------------------------------------------------------------------

KOKORO_VOICE = "af_heart"  # a warm American English voice
KOKORO_SPEED = 0.9  # a little slower than an adult reading to an adult
KOKORO_RATE = 24_000
MAX_CHARS = 2000


def download_kokoro():
    from kokoro import KPipeline

    # Fetches the weights, the voice and the English pronunciation data into the image.
    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    for _ in pipe("Hello! Let's read together.", voice=KOKORO_VOICE):
        pass


voice_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "espeak-ng")
    .pip_install("kokoro==0.9.4", "soundfile==0.13.1", "numpy==1.26.4", "fastapi[standard]==0.115.6")
    .run_function(download_kokoro)
)


@app.cls(
    image=voice_image,
    cpu=2.0,
    memory=2048,
    timeout=120,
    scaledown_window=300,
    min_containers=int(os.environ.get("MIN_CONTAINERS", "0")),
    secrets=[modal.Secret.from_name("readcheck-speech")],
)
class Voice:
    @modal.enter()
    def load(self):
        from kokoro import KPipeline

        self.pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")

    def synthesize(self, text: str, speed: float) -> bytes:
        import numpy as np

        chunks = [np.asarray(audio, dtype=np.float32) for _, _, audio in self.pipe(text, voice=KOKORO_VOICE, speed=speed) if audio is not None]
        if not chunks:
            raise ValueError("nothing to say")
        pcm = np.concatenate(chunks).astype(np.float32).tobytes()
        return subprocess.run(
            ["ffmpeg", "-nostdin", "-loglevel", "error", "-f", "f32le", "-ar", str(KOKORO_RATE), "-ac", "1", "-i", "pipe:0",
             "-codec:a", "libmp3lame", "-b:a", "64k", "-f", "mp3", "pipe:1"],
            input=pcm,
            capture_output=True,
            check=True,
        ).stdout

    @modal.asgi_app()
    def web(self):
        from fastapi import FastAPI, HTTPException, Request
        from fastapi.responses import Response
        from pydantic import BaseModel, Field

        api = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
        token = os.environ["STT_TOKEN"]

        class SpeakBody(BaseModel):
            text: str = Field(min_length=1, max_length=MAX_CHARS)
            speed: float = Field(default=KOKORO_SPEED, ge=0.5, le=1.5)

        def check_auth(request: Request):
            if request.headers.get("authorization") != f"Bearer {token}":
                raise HTTPException(status_code=401, detail="unauthorized")

        @api.get("/warm")
        def warm(request: Request):
            check_auth(request)
            return {"ok": True}

        @api.post("/speak")
        def speak(body: SpeakBody, request: Request):
            check_auth(request)
            try:
                mp3 = self.synthesize(body.text.strip(), body.speed)
            except ValueError:
                raise HTTPException(status_code=400, detail="nothing to say")
            return Response(content=mp3, media_type="audio/mpeg")

        return api
