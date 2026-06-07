import type { Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppearanceProvider } from "@/components/appearance/AppearanceProvider";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { MobileViewportFix } from "@/components/pwa/MobileViewportFix";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import {
  DEFAULT_APPEARANCE,
  parseIconTheme,
  parseThemeMode,
} from "@/lib/appearance/types";
import { rootMetadata } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e31b23",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const appearanceEnabled = h.get("x-pf-appearance") === "1";
  const initialAppearance = appearanceEnabled
    ? {
        themeMode: parseThemeMode(h.get("x-pf-theme-mode")),
        iconTheme: parseIconTheme(h.get("x-pf-icon-theme")),
      }
    : DEFAULT_APPEARANCE;
  const isDark = appearanceEnabled && initialAppearance.themeMode === "dark";

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      data-theme={isDark ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-full font-sans text-[var(--pf-black)]",
          isDark ? "bg-[var(--background)]" : "bg-white"
        )}
      >
        <AppearanceProvider enabled={appearanceEnabled} initial={initialAppearance}>
          <div className="pf-app-shell flex min-h-full flex-col">
            <DemoModeBanner />
            <InstallPrompt />
            <MobileViewportFix />
            <ServiceWorkerRegister />
            {children}
          </div>
        </AppearanceProvider>
      </body>
    </html>
  );
}
