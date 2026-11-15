import type { Metadata } from "next";
import { InfoCard, InfoList, InfoPage } from "@/components/app/info";
import { MAX_KIDS } from "@/lib/store/limits";

export const metadata: Metadata = { title: "About — ReadBuddy", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <InfoPage path="/about" kicker="About" title="About ReadBuddy" lead="A reading and math coach for parents of children from Pre-K to grade 4.">
      <InfoCard glyph="buddy" tone="lilac" title="What it is">
        <p>ReadBuddy helps you help your child with letters, reading and math at home. It shows where your child is today and gives you a few minutes of practice for every day.</p>
      </InfoCard>
      <InfoCard glyph="people" tone="mint" title="You sit with your child">
        <p>The app is made for the two of you together. You start the check, listen along and see the result. Your child plays the games while you stay close.</p>
      </InfoCard>
      <InfoCard glyph="timer" tone="peach" title="1-minute checks">
        <p>Your child reads aloud, answers math facts or names letters for one minute. ReadBuddy compares the score with what is typical for the grade, so you know whether your child is on track.</p>
        <p>For reading, the comparison uses the Hasbrouck &amp; Tindal 2017 oral reading norms, the same kind of measure schools use.</p>
      </InfoCard>
      <InfoCard glyph="calendar" tone="candy" title="Short daily practice">
        <InfoList
          items={[
            "5 to 15 minutes a day, depending on the grade.",
            "Short games: Hear a letter, Big word, Speed math, and a story about what your child loves.",
            "Stars and a streak to keep it going, and a Progress tab to see growth over time.",
          ]}
        />
      </InfoCard>
      <InfoCard glyph="phone" tone="lilac" title={`Up to ${MAX_KIDS} children, no account`}>
        <p>Add up to {MAX_KIDS} children on one phone and switch between them in Family. There is no sign-in: everything is kept in this browser.</p>
      </InfoCard>
      <InfoCard glyph="wrench" tone="mint" title="A hackathon build">
        <p>ReadBuddy was built for a hackathon. It is a working prototype, not a finished product: things may change or break, and it is free to use as it is.</p>
      </InfoCard>
    </InfoPage>
  );
}
