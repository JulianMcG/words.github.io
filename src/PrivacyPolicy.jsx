import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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

        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-10">Last updated: May 6, 2025</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-[var(--color-text-primary)]">

          <section>
            <p>
              Words ("we", "our", or "us") is a personal project operated by Julian McGuire. This Privacy Policy
              explains what information we collect when you use Words at words.github.io, how we use it, and what
              rights you have over your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>

            <h3 className="font-medium mb-1 text-[var(--color-text-primary)]">Account Information</h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              When you sign up for Cloud Sync, we collect your email address and, if you use Google Sign-In,
              your Google account name and profile picture. This information is provided to us by Firebase
              Authentication (operated by Google) and is used solely to identify your account.
            </p>

            <h3 className="font-medium mb-1 text-[var(--color-text-primary)]">Document Content</h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              When Cloud Sync is enabled, the content of your documents is stored in Google Cloud Firestore.
              This includes document text, formatting, titles, folder names, and other metadata you create.
              Documents you keep stored locally only (without signing in) are never transmitted to our servers.
            </p>

            <h3 className="font-medium mb-1 text-[var(--color-text-primary)]">Usage Data</h3>
            <p className="text-[var(--color-text-muted)]">
              We do not use analytics services or collect behavioral data about how you use the app. No cookies
              are set by us beyond what Firebase requires to maintain your authenticated session.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li>To authenticate you and maintain your session.</li>
              <li>To sync your documents across devices when Cloud Sync is enabled.</li>
              <li>To associate your documents with your account so you can access them from any device.</li>
            </ul>
            <p className="text-[var(--color-text-muted)] mt-3">
              We do not use your information for advertising, profiling, or sale to third parties. We do not
              share your data with any third party except as described in Section 3.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Third-Party Services</h2>

            <h3 className="font-medium mb-1 text-[var(--color-text-primary)]">Firebase (Google LLC)</h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              We use Firebase Authentication and Cloud Firestore, both operated by Google LLC, to handle
              user authentication and cloud document storage. Your account information and cloud documents
              are stored on Google's infrastructure and subject to Google's Privacy Policy.
            </p>

            <h3 className="font-medium mb-1 text-[var(--color-text-primary)]">Google Gemini AI</h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              Words includes an optional AI feature that uses Google's Gemini API to suggest names for
              documents and folders. When this feature is invoked, a short snippet of your document or
              folder context is sent to Google's Gemini API. This is only triggered by explicit user
              action (e.g., using the auto-name feature). Refer to Google's Privacy Policy for how they
              handle API data.
            </p>

            <h3 className="font-medium mb-1 text-[var(--color-text-primary)]">Google Docs</h3>
            <p className="text-[var(--color-text-muted)]">
              If you use the Google Docs import or export feature, content is sent to Google's API on your
              behalf. This is an explicit, user-initiated action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Data Retention</h2>
            <p className="text-[var(--color-text-muted)]">
              Your cloud documents and account data are retained as long as your account exists. You can
              delete individual documents at any time from within the app. To request full deletion of your
              account and all associated cloud data, contact us at the address below and we will process
              your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Security</h2>
            <p className="text-[var(--color-text-muted)]">
              All data is transmitted over HTTPS. Cloud documents are stored in Google Cloud Firestore, which
              provides server-side encryption at rest. Access to your documents is restricted to your
              authenticated account via Firestore Security Rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Your Rights</h2>
            <p className="text-[var(--color-text-muted)] mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)]">
              <li>Access the data we hold about you.</li>
              <li>Delete your account and associated cloud data.</li>
              <li>Export your documents (you can copy content directly from the editor).</li>
              <li>Use Words entirely without an account — local documents are never transmitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-[var(--color-text-muted)]">
              Words is not directed at children under 13. We do not knowingly collect personal information
              from children under 13. If you believe a child has provided us with personal information,
              please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-[var(--color-text-muted)]">
              We may update this Privacy Policy from time to time. When we do, we will update the "Last
              updated" date at the top. Continued use of Words after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Contact</h2>
            <p className="text-[var(--color-text-muted)]">
              Questions or requests regarding this Privacy Policy can be sent to:{' '}
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
