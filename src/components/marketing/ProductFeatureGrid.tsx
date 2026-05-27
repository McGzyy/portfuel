import { LANDING_PRODUCT_PILLARS } from "@/lib/marketing/plans";

export function ProductFeatureGrid() {
  return (
    <section className="border-b border-[var(--pf-border)] bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="pf-eyebrow">What you get</p>
          <h2 className="pf-display mt-3 text-2xl sm:text-3xl">Built like a trading terminal</h2>
          <p className="pf-lead mx-auto mt-3 max-w-2xl text-sm">
            Member is the full workspace. Pro adds market intel, screeners, and deeper analytics —
            same charts and feed, more research firepower.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {LANDING_PRODUCT_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-5"
            >
              <h3 className="text-base font-bold text-[var(--pf-black)]">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
