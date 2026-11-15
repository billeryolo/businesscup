import type { Metadata } from "next";
import { InfoCard, InfoList, InfoPage } from "@/components/app/info";

export const metadata: Metadata = { title: "Privacy — ReadBuddy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <InfoPage path="/privacy" kicker="Privacy" title="Your family’s data" lead="No account, no sign-in. Here is what stays on this phone and what is sent out, in plain words.">
      <InfoCard glyph="phone" tone="lilac" title="Kept in this browser">
        <p>ReadBuddy has no accounts. These are saved only in this browser’s storage on this device:</p>
        <InfoList
          items={[
            "Your children: first name, grade, avatar, stars and streak.",
            "The results of every 1-minute check.",
            "Your chats with the assistant.",
            "Your settings, such as the voice in games.",
          ]}
        />
        <p>We have no copy of it. If you clear the browser’s data or switch phones, it is gone.</p>
      </InfoCard>
      <InfoCard glyph="trash" tone="candy" title="How to delete it">
        <InfoList
          items={[
            <>Everything at once: open Family and tap “Erase everything”.</>,
            <>One child: in Family, tap the pencil next to the child, then “Remove” with the child’s name. Their checks and chat go too.</>,
          ]}
        />
        <p>Both happen right away and cannot be undone.</p>
      </InfoCard>
      <InfoCard glyph="mic" tone="mint" title="The reading check and the microphone">
        <p>With “App listens”, two things happen while your child reads:</p>
        <InfoList
          items={[
            "Your browser’s own speech recognition follows the words. In most browsers this is done by the browser maker’s speech service, under their privacy terms.",
            "A recording of that one minute is sent to our speech service, which turns it into words to score the reading. The recording is deleted as soon as the answer is sent back. It is not stored.",
          ]}
        />
        <p>Prefer no microphone? Choose “I’ll mark it” and tap the misread words yourself. Nothing is recorded or sent.</p>
      </InfoCard>
      <InfoCard glyph="spark" tone="peach" title="The assistant and stories">
        <p>Answers and stories are written by Claude, an AI model from Anthropic. To get them, the app sends:</p>
        <InfoList
          items={[
            "Assistant: your recent messages in the chat, plus your child’s grade, daily minutes, stars, streak, today’s activities and the scores of the last five checks.",
            "Story: the topic you picked and your child’s grade.",
          ]}
        />
        <p>Your child’s name is swapped for a placeholder before a message is sent, and put back on your phone. Please don’t type other personal details into the chat.</p>
      </InfoCard>
      <InfoCard glyph="speaker" tone="lilac" title="The voice in games">
        <p>Most letters and words play from sound files that come with the app. Lines that are not pre-recorded, such as story pages, are sent as text to our voice service to be read out loud. A story page can include your child’s first name.</p>
        <p>To stop this, turn off “Voice in games” in Family.</p>
      </InfoCard>
      <InfoCard glyph="shield" tone="mint" title="What we don’t do">
        <InfoList
          items={[
            "No analytics or advertising trackers in the app.",
            "No email, password or payment details: there is no account to collect them for.",
            "No audio kept after a check is scored.",
          ]}
        />
        <p>Like any website, the servers that deliver the app and its speech and AI services receive technical details such as your IP address when your phone connects to them.</p>
      </InfoCard>
    </InfoPage>
  );
}
