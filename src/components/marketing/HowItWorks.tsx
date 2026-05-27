import { LineChart, ShieldCheck, Users } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/lib/marketing/plans";

const stepIcons = [Users, LineChart, ShieldCheck] as const;

export function HowItWorks() {
  return (
    <section className="pf-section-alt">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <p className="pf-eyebrow text-center">How it works</p>
        <h2 className="pf-display mt-3 text-center">Built for serious call tracking</h2>
        <p className="pf-lead mx-auto mt-4 max-w-xl text-center">
          Structured theses, live marks, Fueled desk research, and accountability on the
          leaderboard.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            const Icon = stepIcons[i] ?? Users;
            return (
              <div key={step.title} className="pf-step-card relative text-center md:text-left">
                <span className="pf-step-number">{i + 1}</span>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pf-red-muted)] text-[var(--pf-red)] md:mx-0">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--pf-black)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">{step.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
