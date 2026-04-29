import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MedRoles collects, uses, and protects your personal data.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: 29 April 2026</p>

        <Section title="Who we are">
          <p>
            MedRoles (<strong>medroles.co.uk</strong>) is an independent NHS doctor job board operated
            in the United Kingdom. We are not affiliated with NHS England or any NHS trust.
          </p>
          <p>
            For privacy enquiries, contact us at{" "}
            <a href="mailto:hello@medroles.co.uk" className="text-emerald-600 hover:underline">
              hello@medroles.co.uk
            </a>
            .
          </p>
        </Section>

        <Section title="What data we collect and why">
          <p>We only collect personal data in one situation:</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden mt-2">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Why</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Legal basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 text-gray-600 align-top">Email address</td>
                  <td className="px-4 py-3 text-gray-600 align-top">
                    To send you job alert emails matching your chosen specialty, grade, and region
                  </td>
                  <td className="px-4 py-3 text-gray-600 align-top">
                    Your consent (UK GDPR Article 6(1)(a))
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            Trust reviews and interview intel you submit contain no name, email, or other identifier —
            they are anonymous by design.
          </p>
        </Section>

        <Section title="What we do not collect">
          <ul className="list-disc list-inside space-y-1">
            <li>We do not use tracking cookies</li>
            <li>We do not build advertising profiles</li>
            <li>We do not sell or share your data with third parties for marketing</li>
            <li>
              Website analytics (page views, countries, referrers) are collected via Vercel Web
              Analytics, which is cookieless and does not process personal data
            </li>
          </ul>
        </Section>

        <Section title="How we store your data">
          <p>
            Your email address and alert preferences are stored in a database hosted by{" "}
            <strong>Supabase</strong>, a cloud database provider. Job alert emails are sent via{" "}
            <strong>Resend</strong>, an email delivery service. Both providers are GDPR-compliant and
            act as data processors on our behalf.
          </p>
          <p>
            The site is hosted on <strong>Vercel</strong>, whose infrastructure is certified under
            multiple security and privacy standards.
          </p>
        </Section>

        <Section title="How long we keep your data">
          <p>
            We keep your email address and alert preferences for as long as you have an active job
            alert. You can delete your data at any time by unsubscribing using the link at the bottom
            of any alert email. Upon unsubscribing, your record is deleted immediately.
          </p>
        </Section>

        <Section title="Your rights">
          <p>Under UK GDPR you have the right to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Withdraw consent</strong> — unsubscribe at any time via the link in any alert
              email
            </li>
            <li>
              <strong>Access</strong> — request a copy of the data we hold about you
            </li>
            <li>
              <strong>Erasure</strong> — request deletion of your data
            </li>
            <li>
              <strong>Rectification</strong> — request correction of inaccurate data
            </li>
            <li>
              <strong>Complaint</strong> — lodge a complaint with the{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Information Commissioner&apos;s Office (ICO)
              </a>
            </li>
          </ul>
          <p>
            To exercise any right other than unsubscribing, email{" "}
            <a href="mailto:hello@medroles.co.uk" className="text-emerald-600 hover:underline">
              hello@medroles.co.uk
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes we will update the &quot;Last updated&quot; date above. Continued use
            of job alerts after a change constitutes acceptance of the updated policy.
          </p>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-400">
          <Link href="/" className="text-emerald-600 hover:underline">
            ← Back to MedRoles
          </Link>
        </div>
      </main>
    </div>
  );
}
