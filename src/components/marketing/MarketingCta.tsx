import Link from "next/link";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export function MarketingCta() {
  return (
    <section className="pf-cta-band">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Ready to join the action?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80">
          Member from $79/mo · Pro Intelligence $129/mo. Full workspace, live marks, ticker intel,
          and rankings.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/join">
            <Button
              size="lg"
              className="bg-white text-[var(--pf-black)] hover:bg-white/90"
            >
              {COPY.ctaGetAccess}
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
