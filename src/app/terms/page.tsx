import type { Metadata } from "next";
import { contactEmail, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms — ReadCheck", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="November 4, 2026">
      <p>By using ReadCheck you agree to these terms. ReadCheck is in beta and is free to use while it is in beta.</p>

      <h2>What ReadCheck is, and isn&apos;t</h2>
      <p>
        ReadCheck is a reading fluency screening for parents. It compares a one-minute reading with published grade-level norms and suggests practice. It is not
        a diagnosis of dyslexia or any other condition, and it doesn&apos;t replace an evaluation by a teacher, reading specialist or doctor. Speech recognition
        can make mistakes, so please review the scoring before relying on a result.
      </p>

      <h2>Your account</h2>
      <p>
        You must be an adult and the parent or guardian of any child you check. Keep access to your email secure, because it is how you sign in. You can delete
        your account at any time from the dashboard.
      </p>

      <h2>Fair use</h2>
      <p>Don&apos;t misuse the service: no attempts to access other people&apos;s data, overload the service, or copy the stories and content in bulk.</p>

      <h2>Paid plans</h2>
      <p>No payments are taken during the beta. If we introduce paid plans, prices and terms will be shown clearly before you agree to anything.</p>

      <h2>No warranty</h2>
      <p>
        The service is provided as it is, without warranties. To the extent the law allows, we aren&apos;t liable for decisions made based on a result or for
        indirect losses.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version.</p>

      {contactEmail ? (
        <p>
          Contact: <a href={`mailto:${contactEmail}`} className="font-semibold underline">{contactEmail}</a>
        </p>
      ) : null}
    </LegalPage>
  );
}
