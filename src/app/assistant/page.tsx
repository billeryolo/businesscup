import Link from "next/link";

// The assistant screen in its first form: the orb, the greeting and the input pill. Talking to it
// arrives in its own pull request.
export default function AssistantPage() {
  return (
    <div className="min-h-dvh flex-1 bg-black font-app text-white">
      <div
        className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center overflow-hidden px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]"
        style={{ background: "radial-gradient(120% 60% at 50% 100%, #2f6fe0 0%, #0c2a78 30%, #050b1e 62%, #02040c 100%)" }}
      >
        <Link href="/home" aria-label="Close" className="self-end rounded-full bg-white/10 p-3 backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </Link>

        <div className="orb mt-12 h-56 w-56">
          <i />
        </div>

        <p className="mt-14 text-lg text-white/70">Hello!</p>
        <h1 className="mt-2 text-center text-[34px] font-semibold leading-[1.15] tracking-tight">
          How can I help
          <br />
          you today?
        </h1>

        <div className="mt-auto flex w-full items-center justify-between rounded-full border border-white/25 bg-white/10 px-6 py-5 text-white/60 backdrop-blur-md">
          <span>Tell me about today…</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 10v4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
