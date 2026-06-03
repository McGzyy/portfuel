"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyCopyTemplate,
  COPY_PLACEHOLDER_HELP,
  composeMilestonePostText,
  type SocialPostCopy,
} from "@/lib/social/copy-templates";

const DEMO_LINK = "https://portfuel.pro/ticker/NVDA?utm_source=x&utm_medium=social&utm_campaign=preview";

function tweetLength(text: string): string {
  return `${text.length} / 280`;
}

export function AdminSocialCopyPanel() {
  const [copy, setCopy] = useState<SocialPostCopy | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/social/copy");
    if (res.ok) {
      const json = (await res.json()) as { copy: SocialPostCopy };
      setCopy(json.copy);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const previews = useMemo(() => {
    if (!copy) return null;
    return {
      memberWin: applyCopyTemplate(copy.memberWinTemplate, {
        symbol: "NVDA",
        direction: "long",
        return_line: "+24.2% since publication",
        member_handle: "@demo_member",
        thesis_block: "AI capex cycle intact; positioning for continuation.\n",
        link: DEMO_LINK,
        disclaimer: copy.disclaimer,
      }),
      memberUpdate: applyCopyTemplate(copy.memberWinUpdateTemplate, {
        symbol: "NVDA",
        direction: "long",
        headline: "Performance update · +25% on record",
        return_line: "+27.8% since publication",
        link: DEMO_LINK,
        disclaimer: copy.disclaimer,
      }),
      weekly: applyCopyTemplate(copy.weeklyDigestTemplate, {
        digest_lines: [
          "1. $NVDA long · +24.1% · @alice",
          "2. $AAPL long · +21.3% · @bob",
          "3. $META long · +20.5% · @carol",
        ].join("\n"),
        link: "https://portfuel.pro/?utm_source=x&utm_medium=social&utm_campaign=weekly_digest",
        disclaimer: copy.disclaimer,
      }),
      milestone: composeMilestonePostText(copy, {
        milestone: "return_25",
        symbol: "NVDA",
        direction: "long",
        returnPct: 27.8,
        link: DEMO_LINK,
      }).text,
    };
  }, [copy]);

  async function save() {
    if (!copy) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/social/copy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberWinTemplate: copy.memberWinTemplate,
        memberWinUpdateTemplate: copy.memberWinUpdateTemplate,
        weeklyDigestTemplate: copy.weeklyDigestTemplate,
        fueledTemplate: copy.fueledTemplate,
        leaderboardTemplate: copy.leaderboardTemplate,
        disclaimer: copy.disclaimer,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Save failed.");
      return;
    }
    setCopy((await res.json()).copy as SocialPostCopy);
    setMessage("All X templates saved.");
  }

  if (!copy) return null;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Brand voice
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">X post copy templates</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Edit outbound copy for member spotlights, weekly digest, desk, and rankings. Milestone
        lead/tail copy is edited under Milestone charts below.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TemplateField
          id="member-win"
          label="Member spotlight"
          hint="First public post when a call qualifies."
          value={copy.memberWinTemplate}
          preview={previews?.memberWin}
          onChange={(v) => setCopy({ ...copy, memberWinTemplate: v })}
        />
        <TemplateField
          id="member-update"
          label="Member spotlight update"
          hint="Quote-tweet at +25% or target."
          value={copy.memberWinUpdateTemplate}
          preview={previews?.memberUpdate}
          onChange={(v) => setCopy({ ...copy, memberWinUpdateTemplate: v })}
        />
        <TemplateField
          id="weekly-digest"
          label="Weekly digest"
          hint="Monday-style recap · top 3 calls."
          value={copy.weeklyDigestTemplate}
          preview={previews?.weekly}
          onChange={(v) => setCopy({ ...copy, weeklyDigestTemplate: v })}
          className="lg:col-span-2"
        />
        <TemplateField
          id="fueled"
          label="Fueled desk"
          value={copy.fueledTemplate}
          onChange={(v) => setCopy({ ...copy, fueledTemplate: v })}
        />
        <TemplateField
          id="leaderboard"
          label="Rankings"
          value={copy.leaderboardTemplate}
          onChange={(v) => setCopy({ ...copy, leaderboardTemplate: v })}
        />
        <div className="lg:col-span-2">
          <Label htmlFor="disclaimer">Disclaimer (all posts)</Label>
          <Textarea
            id="disclaimer"
            className="mt-2 min-h-[60px] font-mono text-xs"
            value={copy.disclaimer}
            onChange={(e) => setCopy({ ...copy, disclaimer: e.target.value })}
          />
        </div>
      </div>

      <details className="mt-4 text-xs text-[var(--pf-gray-500)]">
        <summary className="cursor-pointer font-semibold text-[var(--pf-gray-600)]">
          Placeholders
        </summary>
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          {COPY_PLACEHOLDER_HELP.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save templates"}
        </Button>
        {message ? <span className="text-sm text-[var(--pf-gray-600)]">{message}</span> : null}
      </div>
    </section>
  );
}

function TemplateField({
  id,
  label,
  hint,
  value,
  preview,
  onChange,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  preview?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{hint}</p> : null}
      <Textarea
        id={id}
        className="mt-2 min-h-[120px] font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {preview ? (
        <div className="mt-3 rounded-lg border border-[var(--pf-border)] bg-[#0f1419] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Preview · {tweetLength(preview)}
          </p>
          <pre className="mt-2 text-xs leading-relaxed whitespace-pre-wrap text-white/90">
            {preview}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
