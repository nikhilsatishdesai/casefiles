import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CASEFILES — Every Case Has A Story",
  description:
    "An endless detective series where you are the detective. One city. One nightly mystery. Every clue matters.",
  applicationName: "CASEFILES",
  keywords: ["detective game", "mystery", "noir", "pixel art", "deduction"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "CASEFILES",
    description: "Every Case Has A Story. Tonight's episode is waiting, Detective.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
