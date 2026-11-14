import { ComingNext, ScreenHeader } from "@/components/app/screen";

export default function FamilyPage() {
  return (
    <>
      <ScreenHeader title="Family" subtitle="Children, settings and plans" />
      <ComingNext items={["Child cards: add, edit, delete", "Microphone, reminders and sounds", "Plans: 7 days free"]} />
    </>
  );
}
