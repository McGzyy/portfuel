import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { LaunchAccessCard } from "@/components/admin/LaunchAccessCard";
import { COPY } from "@/lib/copy";
import { isDemoMode } from "@/lib/demo/config";

const CHECKLIST = [
  {
    title: "Publish 2–3 Fueled desk calls",
    body: "House theses show on desk, overview, and ticker charts. Use Desk tab → publish with is_fueled.",
    href: "/admin?tab=desk",
    cta: "Open desk admin",
  },
  {
    title: "Add a weekly desk note",
    body: "Short narrative (sector, macro, or what you are watching). Appears on desk and overview.",
    href: "/admin?tab=desk",
    cta: "Edit desk brief",
  },
  {
    title: "Seed model portfolio (optional)",
    body: "Open positions with conviction scores — overview sidebar and desk portfolio.",
    href: "/admin?tab=desk",
    cta: "Manage portfolio",
  },
  {
    title: "Publish your own member call",
    body: "Your profile, return chart, and rankings row look real when you have skin in the game.",
    href: COPY.newCallHref,
    cta: COPY.newCall,
  },
  {
    title: "Invite 3–5 founding members",
    body: "Use the invite link on Launch (skips Stripe), then Comp Pro on their Member 360 page.",
    href: "/admin?tab=launch",
    cta: "Copy invite link",
  },
] as const;

export function AdminLaunchPanel() {
  const demoOn = isDemoMode();

  return (
    <div className="space-y-8">
      <AdminPanelHeader
        group="Billing & launch"
        title="The feed fills when you publish — then when members join"
        description={
          <>
            An empty feed is normal before launch. Fueled desk content and a few real members make
            the workspace feel professional. Full playbook:{" "}
            <code className="rounded bg-[var(--pf-gray-100)] px-1 py-0.5 text-xs">
              docs/LAUNCH-PLAYBOOK.md
            </code>
            .
          </>
        }
      />

      <LaunchAccessCard />

      <section className="pf-workspace-panel overflow-hidden">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <h3 className="text-sm font-bold text-[var(--pf-black)]">Week 0 checklist</h3>
          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
            Repeat weekly: desk note + at least one Fueled thesis.
          </p>
        </div>
        <ul className="divide-y divide-[var(--pf-border)]">
          {CHECKLIST.map((item) => (
            <li key={item.title} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-300)]" strokeWidth={2.5} />
                <div>
                  <p className="text-sm font-semibold text-[var(--pf-black)]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">{item.body}</p>
                </div>
              </div>
              <Link href={item.href} className="shrink-0">
                <Button variant="outline" size="sm">
                  {item.cta}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="pf-workspace-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--pf-black)]">Preview mode (demos)</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--pf-gray-500)]">
              Set{" "}
              <code className="rounded bg-[var(--pf-gray-100)] px-1 font-mono">
                NEXT_PUBLIC_DEMO_MODE=true
              </code>{" "}
              in Vercel / <code className="font-mono">.env.local</code> to show sample feed, rankings,
              and messages for screenshots. Turn off for production social proof.
            </p>
          </div>
          <span
            className={
              demoOn
                ? "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
                : "inline-flex items-center gap-1.5 rounded-full bg-[var(--pf-gray-100)] px-3 py-1 text-xs font-semibold text-[var(--pf-gray-600)]"
            }
          >
            {demoOn ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Preview mode ON
              </>
            ) : (
              "Preview mode off"
            )}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              View workspace
            </Button>
          </Link>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              Marketing home
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Social curation
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--pf-black)]">
          From X post → Analyze → Fueled call
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
          Paste an X URL on Admin → X Ingest, analyze each ticker, then publish. See{" "}
          <code className="rounded bg-white px-1">docs/X-SOCIAL.md</code>.
        </p>
        <Link href="/calls/new" className="mt-3 inline-block">
          <Button variant="outline" size="sm">
            Publish call
          </Button>
        </Link>
      </section>
    </div>
  );
}
