import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { TickerPageContent } from "@/components/ticker/TickerPageContent";
import { TickerPageSkeleton } from "@/components/ticker/TickerPageSkeleton";
import { SITE_NAME } from "@/lib/seo/site";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  return {
    title: `${symbol} · Ticker intel`,
    description: `Live price, community theses, and market intelligence for ${symbol} on ${SITE_NAME}.`,
  };
}

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const session = await getSession();

  const content = (
    <Suspense fallback={<TickerPageSkeleton />}>
      <TickerPageContent symbol={symbol} session={session} />
    </Suspense>
  );

  if (session) {
    return content;
  }

  return (
    <>
      <SiteHeader />
      <div className="pf-app-bg">
        <main className="mx-auto max-w-5xl px-4 py-8">{content}</main>
      </div>
    </>
  );
}
