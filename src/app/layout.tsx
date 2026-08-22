import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Instrument_Sans,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const dayflowDisplay = Bricolage_Grotesque({
  variable: "--font-dayflow-display",
  subsets: ["latin"],
});
const dayflowBody = Instrument_Sans({
  variable: "--font-dayflow-body",
  subsets: ["latin"],
});
const dayflowMono = IBM_Plex_Mono({
  variable: "--font-dayflow-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Dayflow — HRMS",
  description: "Every workday, perfectly aligned.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dayflowDisplay.variable} ${dayflowBody.variable} ${dayflowMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans flex flex-col">{children}</body>
    </html>
  );
}
