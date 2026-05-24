import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PortFuel.pro — Stock calls dashboard",
  description:
    "Professional stock call tracking, performance scoring, and community intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-[var(--pf-black)]">
        <DemoModeBanner />
        {children}
      </body>
    </html>
  );
}
