import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-hover-strong)] rounded-md px-2.5 py-1.5 -ml-2.5 transition-all duration-150 mb-10 select-none"
        >
          <ArrowLeft size={13} className="shrink-0 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back
        </button>

        <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-10">Last updated: May 6, 2025</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-[var(--color-text-primary)]">

          <section>
            <p>
              These Terms of Service ("Terms") govern your access to and use of Words ("the Service"), a
              web-based document editor available at words.github.io, operated by Julian McGuire ("we",
              "us", or "our"). By using the Service, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Eligibility</h2>
            <p className="text-[var(--color-text-muted)]">
              You must be at least 13 years old to use Words. By creating an account or using Cloud Sync,
              you represent that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Your Account</h2>
            <p className="text-[var(--color-text-muted)] mb-3">
              Cloud Sync requires an account created via Google Sign-In or email and password. You are
              responsible for maintaining the security of your account credentials. You are responsible for
              all activity that occurs under your account.
            </p>
            <p className="text-[var(--color-text-muted)]">
              Words is free to use. We reserve the right to introduce paid features in the future; if we do,
              we will provide clear notice before any charges apply.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Your Content</h2>
            <p className="text-[var(--color-text-muted)] mb-3">
              You retain full ownership of all content you create and store in Words. We do not claim any
              intellectual property rights over your documents.
            </p>
            <p className="text-[var(--color-text-muted)]">
              By enabling Cloud Sync, you grant us a limited, non-exclusive, royalty-free license to store
              and transmit your content solely for the purpose of operating the Service (i.e., syncing your
              documents to your account). We do not access, read, or use your document content for any
              other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Acceptable Use</h2>
            <p className="text-[var(--color-text-muted)] mb-3">You agree not to use Words to:</p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li>Store or distribute content that is illegal, harmful, threatening, abusive, or violates any applicable law.</li>
              <li>Attempt to gain unauthorized access to our systems or another user's account.</li>
              <li>Reverse-engineer, scrape, or attempt to extract source code or data from the Service in ways not permitted by applicable law.</li>
              <li>Use the Service in a way that interferes with or disrupts its normal operation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. AI Features</h2>
            <p className="text-[var(--color-text-muted)]">
              Words includes optional AI-powered features (e.g., automatic document naming, the Buddy AI
              assistant) powered by Google Gemini. These features are provided as-is and may produce
              inaccurate or unexpected results. You are responsible for reviewing and verifying any
              AI-generated suggestions before relying on them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Service Availability</h2>
            <p className="text-[var(--color-text-muted)]">
              We make no guarantees about the availability or uptime of Words, particularly the Cloud Sync
              feature. The Service is provided as a personal project and may be modified, suspended, or
              discontinued at any time without prior notice. We recommend keeping local backups of any
              important documents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Disclaimers</h2>
            <p className="text-[var(--color-text-muted)]">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, OR NON-INFRINGEMENT. USE OF THE SERVICE IS AT YOUR OWN RISK.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-[var(--color-text-muted)]">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, ARISING OUT OF OR RELATED
              TO YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Termination</h2>
            <p className="text-[var(--color-text-muted)]">
              We reserve the right to suspend or terminate accounts that violate these Terms. You may stop
              using the Service and delete your account at any time. Upon account deletion, your cloud
              data will be removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Changes to These Terms</h2>
            <p className="text-[var(--color-text-muted)]">
              We may update these Terms from time to time. We will update the "Last updated" date when
              we do. Continued use of the Service after changes are posted constitutes your acceptance
              of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Governing Law</h2>
            <p className="text-[var(--color-text-muted)]">
              These Terms are governed by the laws of the United States. Any disputes shall be resolved
              in the jurisdiction where the operator resides.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Contact</h2>
            <p className="text-[var(--color-text-muted)]">
              Questions about these Terms can be sent to:{' '}
              <a
                href="mailto:hi@usewords.app"
                className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                hi@usewords.app
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[var(--color-border-primary)] text-sm text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} Words
        </div>
      </div>
    </div>
  );
}
