import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/components/hq-path/hq-path.css";
import "./globals.css";
import "./path.css";
import { HqFamilyFooter, HqQuestbar, HqThemeScript } from "@/components/hq-path/hq-path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Breath Quest - Novel Interfaces for Future Intelligence",
  description: "Building novel interfaces for future intelligence. What if we could control AI with our breath? A real-time experiment in embodied interaction.",
  icons: {
    icon: '/favicon.svg',
  },
};

const GITHUB = "https://github.com/alibad/breathquest";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-hqp-t="practice" suppressHydrationWarning>
      <head>
        <HqThemeScript />
        {/* The kit's fonts. Next.js drops the @import url(...) inside hq-path.css when it is not first in the bundle. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* The Human Quest family frame (The Path): the same bar and footer on every page, lab pages included. */}
        <HqQuestbar
          product="Breath Quest"
          logo="/logo.svg"
          territory="practice"
          links={[
            { label: "How it works", href: "/#how" },
            { label: "Labs", href: "/#labs" },
            { label: "Audio tools", href: "/audio-tools" },
            { label: "GitHub", href: GITHUB },
          ]}
          cta={{ label: "Play", href: "/hypothesis-3" }}
        />
        {children}
        <HqFamilyFooter
          current="Breath Quest"
          territory="practice"
          extra={[
            { label: "Source on GitHub", href: GITHUB },
            { label: "LinkedIn", href: "http://linkedin.com/in/alibad" },
          ]}
        />
      </body>
    </html>
  );
}
