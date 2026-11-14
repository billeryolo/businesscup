import { ComingNext, ScreenHeader } from "@/components/app/screen";

export default function ProgressPage() {
  return (
    <>
      <ScreenHeader title="Progress" subtitle="Is your child growing over time?" />
      <ComingNext items={["Chart of every check against the grade norm", "List of past checks", "Diary of notes you told the assistant"]} />
    </>
  );
}
