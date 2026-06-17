"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  discordLineFromCopy,
  discordMilestoneLineFromCopy,
} from "@/lib/discord/discord-copy";
import {
  DEFAULT_SOCIAL_POST_COPY,
  DISCORD_COPY_PLACEHOLDER_HELP,
  type SocialPostCopy,
} from "@/lib/social/copy-templates";

const DEMO_SYMBOL = "NVDA";

export function AdminDiscordCopyPanel() {
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
    const c = copy ?? DEFAULT_SOCIAL_POST_COPY;
    return {
      fueled: discordLineFromCopy(c, "fueled"),
      memberNew: discordLineFromCopy(c, "memberNew"),
      spotlight: discordLineFromCopy(c, "memberSpotlight", { symbol: DEMO_SYMBOL }),
      target: discordLineFromCopy(c, "targetHit", { symbol: DEMO_SYMBOL }),
      milestone: discordMilestoneLineFromCopy(c, "return_25", DEMO_SYMBOL),
      digest: discordLineFromCopy(c, "weeklyDigest"),
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
        discordFueledLine: copy.discordFueledLine,
        discordMemberNewLine: copy.discordMemberNewLine,
        discordMemberSpotlightLine: copy.discordMemberSpotlightLine,
        discordTargetHitLine: copy.discordTargetHitLine,
        discordWeeklyDigestLine: copy.discordWeeklyDigestLine,
        discordMilestoneLine: copy.discordMilestoneLine,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(
        json.error === "db_error"
          ? "Save failed — run the discord_post_copy migration."
          : "Save failed."
      );
      return;
    }
    const json = (await res.json()) as { savedCopy: SocialPostCopy };
    setCopy(json.savedCopy);
    setMessage("Discord announcement lines saved.");
  }

  function patch(patch: Partial<SocialPostCopy>) {
    if (!copy) return;
    setCopy({ ...copy, ...patch });
  }

  if (!copy) return null;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Discord copy
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">Announcement lines</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Edit the short message line that appears above call embeds in Discord channels. Supports
        Discord markdown (**bold**, _italic_). Disclaimer text is shared with X under Brand voice.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DiscordLineField
          id="discord-fueled"
          label="Fueled desk call"
          value={copy.discordFueledLine}
          preview={previews.fueled}
          onChange={(v) => patch({ discordFueledLine: v })}
        />
        <DiscordLineField
          id="discord-member-new"
          label="New member call"
          value={copy.discordMemberNewLine}
          preview={previews.memberNew}
          onChange={(v) => patch({ discordMemberNewLine: v })}
        />
        <DiscordLineField
          id="discord-spotlight"
          label="Member spotlight"
          hint="Use {{symbol}} for the ticker."
          value={copy.discordMemberSpotlightLine}
          preview={previews.spotlight}
          onChange={(v) => patch({ discordMemberSpotlightLine: v })}
        />
        <DiscordLineField
          id="discord-target"
          label="Target reached"
          hint="Use {{symbol}} for the ticker."
          value={copy.discordTargetHitLine}
          preview={previews.target}
          onChange={(v) => patch({ discordTargetHitLine: v })}
        />
        <DiscordLineField
          id="discord-milestone"
          label="Return milestone"
          hint="Use {{pct}} and {{symbol}} — e.g. +25% milestone."
          value={copy.discordMilestoneLine}
          preview={previews.milestone}
          onChange={(v) => patch({ discordMilestoneLine: v })}
        />
        <DiscordLineField
          id="discord-digest"
          label="Weekly digest"
          value={copy.discordWeeklyDigestLine}
          preview={previews.digest}
          onChange={(v) => patch({ discordWeeklyDigestLine: v })}
        />
      </div>

      <details className="mt-4 text-xs text-[var(--pf-gray-500)]">
        <summary className="cursor-pointer font-semibold text-[var(--pf-gray-600)]">
          Placeholders
        </summary>
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          {DISCORD_COPY_PLACEHOLDER_HELP.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save Discord lines"}
        </Button>
        {message ? <span className="text-sm text-[var(--pf-gray-600)]">{message}</span> : null}
      </div>
    </section>
  );
}

function DiscordLineField({
  id,
  label,
  hint,
  value,
  preview,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  preview: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{hint}</p> : null}
      <Textarea
        id={id}
        className="mt-2 min-h-[72px] font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-3 rounded-lg border border-[#2f3136] bg-[#2b2d31] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#949ba4]">
          Discord preview
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#dbdee1]">{preview}</p>
      </div>
    </div>
  );
}
