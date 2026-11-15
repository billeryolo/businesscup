import type { Metadata } from "next";
import { InfoCard, InfoPage } from "@/components/app/info";

export const metadata: Metadata = { title: "Terms — ReadBuddy", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <InfoPage path="/terms" kicker="Terms" title="Terms of use" lead="A few plain rules for using ReadBuddy. By using the app you agree to them.">
      <InfoCard glyph="book" tone="lilac" title="A learning tool, not a diagnosis">
        <p>ReadBuddy is for practice and for a quick look at how your child is doing. It is not a medical, psychological or educational assessment, and it does not diagnose dyslexia or any other condition.</p>
        <p>If you are worried about your child’s reading or math, talk with their teacher or a specialist.</p>
      </InfoCard>
      <InfoCard glyph="gauge" tone="peach" title="Results are estimates">
        <p>A check is one minute on one day. Mood, tiredness and noise change the score, and speech recognition can mishear a word. Check the marked words before you save a result, and look at several checks over time rather than a single number.</p>
        <p>Answers from the assistant and the stories are written by AI and can be wrong.</p>
      </InfoCard>
      <InfoCard glyph="hand" tone="mint" title="Use it with an adult">
        <p>ReadBuddy is meant for a parent or guardian together with a child. The adult sets it up, runs the checks, uses the assistant and stays nearby while the child plays.</p>
      </InfoCard>
      <InfoCard glyph="box" tone="candy" title="Provided as it is">
        <p>ReadBuddy is a hackathon prototype. It is free and comes as it is, without any warranty: it may change, lose data or stop working. To the extent the law allows, its makers are not responsible for decisions made because of a result.</p>
      </InfoCard>
    </InfoPage>
  );
}
