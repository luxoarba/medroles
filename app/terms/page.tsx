import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/navbar";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using MedRoles.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: 29 April 2026</p>

        <Section title="About MedRoles">
          <p>
            MedRoles (<strong>medroles.co.uk</strong>) is an independent job aggregation service for
            NHS doctor roles in the United Kingdom. We are not affiliated with NHS England, NHS
            Employers, or any NHS trust.
          </p>
          <p>
            By using MedRoles you agree to these terms. If you do not agree, please do not use the
            site.
          </p>
        </Section>

        <Section title="Job listings">
          <p>
            Job listings on MedRoles are sourced automatically from NHS Jobs and other public NHS
            recruitment platforms. We do not post, verify, or endorse any vacancy. Listings may
            contain errors or become outdated between scrapes.
          </p>
          <p>
            Always verify the details of any vacancy directly with the hiring organisation before
            applying. MedRoles accepts no responsibility for the accuracy, completeness, or
            timeliness of any listing.
          </p>
        </Section>

        <Section title="Job alerts">
          <p>
            By signing up for job alerts you consent to receive email notifications from MedRoles.
            You can unsubscribe at any time using the link included in every alert email. We will not
            use your email address for any other purpose.
          </p>
        </Section>

        <Section title="Trust reviews and interview intel">
          <p>
            Reviews and interview intel are submitted anonymously by users and represent the opinions
            of those individuals. MedRoles does not verify the accuracy of user-submitted content and
            is not responsible for it.
          </p>
          <p>
            By submitting a review or piece of interview intel you confirm that it is honest, based
            on genuine experience, and does not contain defamatory, discriminatory, or otherwise
            unlawful content. We reserve the right to remove any submission at our discretion.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You must not:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Scrape or systematically download content from MedRoles without permission</li>
            <li>Submit false, misleading, or malicious content</li>
            <li>Attempt to interfere with the site&apos;s operation or security</li>
            <li>Use the site for any unlawful purpose</li>
          </ul>
        </Section>

        <Section title="Intellectual property">
          <p>
            The MedRoles name, logo, and original content on this site are our property. Job listing
            data is sourced from publicly available NHS recruitment platforms and remains the property
            of the respective organisations.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            MedRoles is provided &quot;as is&quot; without warranty of any kind. To the fullest extent
            permitted by law, we exclude all liability for loss or damage arising from your use of the
            site, including any reliance on job listings, reviews, or other content.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are governed by the laws of England and Wales. Any disputes shall be subject
            to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms from time to time. The &quot;Last updated&quot; date above will reflect
            any changes. Continued use of MedRoles after a change constitutes acceptance of the
            updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about these terms, email{" "}
            <a href="mailto:hello@medroles.co.uk" className="text-emerald-600 hover:underline">
              hello@medroles.co.uk
            </a>
            .
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
