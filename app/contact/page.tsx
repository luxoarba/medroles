import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/navbar";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the MedRoles team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Get in touch</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Questions, feedback, or want to list roles on MedRoles? Drop us an email.
        </p>
        <a
          href="mailto:hello@medroles.co.uk"
          className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          hello@medroles.co.uk
        </a>
        <div className="mt-10 pt-8 border-t border-gray-200">
          <Link href="/" className="text-sm text-emerald-600 hover:underline">
            ← Back to MedRoles
          </Link>
        </div>
      </main>
    </div>
  );
}
