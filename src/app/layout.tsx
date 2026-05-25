import { Inter } from "next/font/google";
import "./globals.css";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { rootMetadata } from "@/lib/seo/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = rootMetadata;

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
