import { ComingNext, ScreenHeader } from "@/components/app/screen";

export default function LearnPage() {
  return (
    <>
      <ScreenHeader title="Learn" subtitle="Games and stories for your child’s age" />
      <ComingNext items={["Letters, Reading, Numbers and Math sections", "Activity cards that open the games", "Story about… maker"]} />
    </>
  );
}
