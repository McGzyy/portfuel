import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatTierPrice } from "@/lib/marketing/plans";
import { COPY } from "@/lib/copy";

export function DemoJoinFooter({ tier }: { tier: "member" | "pro" }) {
  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-gradient-to-br from-[var(--pf-gray-50)] to-white px-5 py-6 text-center sm:px-8 sm:py-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Ready to trade on record?
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--pf-black)] sm:text-2xl">
        {tier === "pro"
          ? "Start with Member — upgrade to Pro anytime"
          : "Join the member workspace"}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Full feed, Fueled desk, charts with call markers, and a public track record from{" "}
        {formatTierPrice("member")}. Pro Intelligence adds the research terminal at{" "}
        {formatTierPrice("pro")}.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/join">
          <Button>{COPY.ctaGetAccess}</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="outline">Compare plans</Button>
        </Link>
      </div>
    </section>
  );
}
