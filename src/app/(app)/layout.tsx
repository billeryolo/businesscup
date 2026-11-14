import { Suspense } from "react";
import { BottomNav } from "@/components/app/bottom-nav";

// The shell of the mobile app: a phone-width column on a lavender backdrop, with the bottom bar
// on every tab. On a real phone the column simply fills the screen.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh flex-1 bg-lilac font-app text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-mist shadow-[0_0_60px_rgba(27,20,51,0.18)]">
        <main className="flex-1 px-5 pb-[120px] pt-[max(20px,env(safe-area-inset-top))]">{children}</main>
        <Suspense>
          <BottomNav />
        </Suspense>
      </div>
    </div>
  );
}
