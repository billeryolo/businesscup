import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep",
  secondary: "border-2 border-line bg-sheet text-ink hover:border-ink-faint",
  quiet: "text-ink-soft underline-offset-4 hover:text-ink hover:underline",
};

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border-2 border-line bg-sheet p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-read text-sm text-white">
        Rc
      </span>
      ReadBuddy
    </Link>
  );
}
