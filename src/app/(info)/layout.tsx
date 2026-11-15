// The shell for the pages opened from Family (About, Privacy, Terms): the same phone-width column
// as the tabs, without the bottom bar. Each page has its own way back to Family at the top.
export default function InfoLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh flex-1 bg-lilac font-app text-night">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-clip bg-mist shadow-[0_0_60px_rgba(27,20,51,0.18)]">
        <main className="flex-1 px-5 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))]">{children}</main>
      </div>
    </div>
  );
}
