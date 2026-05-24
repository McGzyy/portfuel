import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white font-sans text-[var(--pf-black)]">
        {children}
      </body>
    </html>
  );
}
