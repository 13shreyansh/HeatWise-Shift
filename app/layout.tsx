import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://heatwise-shift.shreyanshagarwal134.chatgpt.site"),
  title: "HeatWise Shift — Heat-risk decisions for outdoor teams",
  description: "A transparent field tool that converts heat, workload, protective gear and symptoms into an actionable shift plan.",
  openGraph: {
    title: "HeatWise Shift",
    description: "Heat decisions, before heat becomes an emergency.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "HeatWise Shift",
    description: "Heat decisions, before heat becomes an emergency.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
