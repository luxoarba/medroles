import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.medroles.co.uk"),
  title: {
    default: "MedRoles — NHS Doctor Jobs",
    template: "%s | MedRoles",
  },
  description:
    "Find NHS doctor jobs across the UK. Browse consultant, registrar, clinical fellow and GP roles with trust reviews, CQC ratings and interview intel.",
  keywords: ["NHS jobs", "doctor jobs", "consultant jobs", "registrar jobs", "clinical fellow", "GP jobs", "NHS careers"],
  openGraph: {
    type: "website",
    siteName: "MedRoles",
    locale: "en_GB",
    url: "https://www.medroles.co.uk",
    title: "MedRoles — NHS Doctor Jobs",
    description:
      "Find NHS doctor jobs across the UK. Browse consultant, registrar, clinical fellow and GP roles with trust reviews, CQC ratings and interview intel.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedRoles — NHS Doctor Jobs",
    description: "Find NHS doctor jobs across the UK.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
