import { SiteHeader } from "@/components/brand/SiteHeader";
import { TickerPageSkeleton } from "@/components/ticker/TickerPageSkeleton";

export default function TickerLoading() {
  return (
    <>
      <SiteHeader />
      <div className="pf-app-bg">
        <main className="mx-auto max-w-6xl px-4 py-8">
          <TickerPageSkeleton />
        </main>
      </div>
    </>
  );
}
