import { LineChart, ShieldCheck, Users } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Claim your PortFuel ID",
    text: "Pick a 5-digit PIN and secure your account with an authenticator app.",
  },
  {
    icon: LineChart,
    title: "Submit & track calls",
    text: "Post stock or crypto theses with targets. Prices refresh and returns update automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Rank & engage",
    text: "Vote on calls, join the discussion, and climb the leaderboard as you deliver.",
  },
];

export function HowItWorks() {
  return (
    <section className="pf-section-alt">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <p className="pf-eyebrow text-center">How it works</p>
        <h2 className="pf-display mt-3 text-center">Built for serious call tracking</h2>
        <p className="pf-lead mx-auto mt-4 max-w-xl text-center">
          No noise — just structured theses, live marks, and accountability.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="pf-step-card relative text-center md:text-left">
              <span className="pf-step-number">{i + 1}</span>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pf-red-muted)] text-[var(--pf-red)] md:mx-0">
                <step.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--pf-black)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
