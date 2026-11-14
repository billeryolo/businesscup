import type { Metadata } from "next";
import { contactEmail, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy — ReadBuddy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="November 4, 2026">
      <p>
        ReadBuddy is a one-minute reading check for parents. It is in beta. This page explains what we collect, why, and how to delete it. In short: we keep
        scores, never audio.
      </p>

      <h2>ReadBuddy is for parents</h2>
      <p>
        A parent or guardian runs the check and owns the account. Children don&apos;t sign up and don&apos;t give us information themselves. Before the
        microphone is used, we ask the parent to confirm they are the parent or guardian and agree to how the reading is processed.
      </p>

      <h2>How the microphone works</h2>
      <p>
        If you choose the microphone, your browser sends the reading to its own speech service to turn it into words: for example Google&apos;s in Chrome or
        Apple&apos;s in Safari. That processing is covered by the browser maker&apos;s privacy terms. ReadBuddy receives only the words, uses them to score the
        reading on your device, and does not store them. We never record or store audio. If you&apos;d rather not use the microphone, choose &quot;Score it
        myself&quot;: you tap the words your child misreads, and nothing is sent anywhere.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Without an account: nothing about you or your child. If you click &quot;Start the free trial&quot;, we count that click with the plan, grade and result type, and nothing that identifies you. Your last result is kept in your own browser so you can save it after signing in.</li>
        <li>With an account: your email address (to sign you in); your child&apos;s first name (a nickname is fine) and grade; and for each reading, the date, the story, the scores, and one letter per word saying whether it was read correctly, misread or skipped. We also store the written summary and plan, the date you gave microphone consent, and the plan you asked for.</li>
        <li>We don&apos;t store audio, transcripts of what your child said, payment details, or advertising trackers.</li>
      </ul>

      <h2>The written summary</h2>
      <p>
        The summary and plan are written either by built-in rules or by Anthropic&apos;s Claude AI from the scores alone. Before anything is sent to the AI,
        your child&apos;s name is replaced with a placeholder, so the AI provider never receives it.
      </p>

      <h2>Where your data lives</h2>
      <p>Accounts and results are stored with Supabase. The site runs on Vercel. Both act as our service providers.</p>

      <h2>Deleting your data</h2>
      <p>
        From your account you can delete a single reading, a child with all of their readings, or your whole account. Deleting the account removes everything
        immediately. {contactEmail ? <>Questions or requests: <a href={`mailto:${contactEmail}`} className="font-semibold underline">{contactEmail}</a>.</> : null}
      </p>

      <h2>Changes</h2>
      <p>If we change what we collect, we will update this page and the date at the top before the change takes effect.</p>
    </LegalPage>
  );
}
