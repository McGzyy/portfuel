"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TweetDeskDraft } from "@/lib/ai/tweet-desk-draft";
import { COPY } from "@/lib/copy";

type XConfigSummary = {
  enabled: boolean;
  dryRun: boolean;
  configured: boolean;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
};

export function AdminSocialPanel() {
  const [config, setConfig] = useState<XConfigSummary | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewType, setPreviewType] = useState<"fueled" | "leaderboard">("fueled");
  const [xLoading, setXLoading] = useState(false);
  const [xMessage, setXMessage] = useState("");

  const [tweetRaw, setTweetRaw] = useState("");
  const [tweetNote, setTweetNote] = useState("");
  const [chosenSymbol, setChosenSymbol] = useState("");
  const [draft, setDraft] = useState<TweetDeskDraft | null>(null);
  const [regexCandidates, setRegexCandidates] = useState<string[]>([]);
  const [tweetLoading, setTweetLoading] = useState(false);
  const [tweetError, setTweetError] = useState("");

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/admin/social/preview");
    if (res.ok) {
      const json = (await res.json()) as { config: XConfigSummary };
      setConfig(json.config);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function previewX(type: "fueled" | "leaderboard") {
    setXLoading(true);
    setXMessage("");
    setPreviewType(type);
    try {
      const res = await fetch("/api/admin/social/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPreviewText("");
        setXMessage(json.error === "no_content" ? "Nothing to post for that type yet." : "Preview failed.");
        return;
      }
      setPreviewText(json.text as string);
      setXMessage(`Preview · ${json.charCount} chars`);
    } catch {
      setXMessage("Preview failed.");
    } finally {
      setXLoading(false);
    }
  }

  async function postX(dryRun: boolean) {
    setXLoading(true);
    setXMessage("");
    try {
      const res = await fetch("/api/admin/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: previewType, dryRun }),
      });
      const json = await res.json();
      if (!res.ok) {
        setXMessage(json.error ?? "Post failed.");
        return;
      }
      setPreviewText(json.text ?? previewText);
      setXMessage(
        json.dryRun
          ? "Dry run — logged server-side; not sent to X."
          : `Posted to X (id ${json.tweetId}).`
      );
    } catch {
      setXMessage("Post failed.");
    } finally {
      setXLoading(false);
    }
  }

  async function draftFromTweet() {
    setTweetLoading(true);
    setTweetError("");
    setDraft(null);
    try {
      const res = await fetch("/api/admin/desk/from-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: tweetRaw,
          adminNote: tweetNote || undefined,
          chosenSymbol: chosenSymbol || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTweetError(json.error === "text_too_short" ? "Paste more tweet text." : "Draft failed.");
        return;
      }
      setDraft(json.draft as TweetDeskDraft);
      setRegexCandidates(json.regexCandidates as string[]);
      if (!chosenSymbol && json.draft?.suggestedSymbol) {
        setChosenSymbol(json.draft.suggestedSymbol);
      }
    } catch {
      setTweetError("Draft failed.");
    } finally {
      setTweetLoading(false);
    }
  }

  const publishHref =
    draft?.suggestedSymbol && draft
      ? `${COPY.newCallHref}?asset=equity&symbol=${encodeURIComponent(draft.suggestedSymbol)}`
      : COPY.newCallHref;

  return (
    <div className="mt-8 space-y-8">
      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          X (Twitter)
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
          Outbound posts to keep the account active
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Start in <strong>dry run</strong> until copy and API keys are right. Setup:{" "}
          <code className="rounded bg-[var(--pf-gray-100)] px-1 py-0.5 text-xs">docs/X-SOCIAL.md</code>
        </p>

        {config ? (
          <ul className="mt-4 grid gap-2 text-xs text-[var(--pf-gray-600)] sm:grid-cols-2">
            <li>
              API enabled:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.enabled ? "yes" : "no"}
              </span>
            </li>
            <li>
              Dry run:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.dryRun ? "yes" : "no"}
              </span>
            </li>
            <li>
              Bearer token:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.configured ? "set" : "missing"}
              </span>
            </li>
            <li>
              Cron types: Fueled {config.fueledPosts ? "on" : "off"} · Leaderboard{" "}
              {config.leaderboardPosts ? "on" : "off"}
            </li>
          </ul>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={xLoading}
            onClick={() => void previewX("fueled")}
          >
            Preview Fueled post
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={xLoading}
            onClick={() => void previewX("leaderboard")}
          >
            Preview rankings post
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={xLoading || !previewText}
            onClick={() => void postX(true)}
          >
            Dry-run post
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={xLoading || !previewText || !config?.configured}
            onClick={() => void postX(false)}
          >
            Post to X
          </Button>
        </div>

        {xMessage ? <p className="mt-3 text-xs text-[var(--pf-gray-600)]">{xMessage}</p> : null}

        {previewText ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4 text-xs leading-relaxed whitespace-pre-wrap text-[var(--pf-gray-800)]">
            {previewText}
          </pre>
        ) : null}
      </section>

      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Tweet → Fueled draft
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
          Paste inbound social text → desk call draft
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          AI suggests tickers and thesis — you pick one symbol, edit levels, then publish as Fueled
          from Admin → Desk or {COPY.newCall}.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label>Tweet / thread text</Label>
            <Textarea
              value={tweetRaw}
              onChange={(e) => setTweetRaw(e.target.value)}
              rows={5}
              placeholder="Paste tweet text or thread excerpt…"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Admin note (optional)</Label>
            <Textarea
              value={tweetNote}
              onChange={(e) => setTweetNote(e.target.value)}
              rows={2}
              placeholder="Why this matters for the desk…"
              className="mt-1.5"
            />
          </div>

          {(regexCandidates.length > 0 || draft?.candidates.length) ? (
            <div>
              <Label>Primary symbol</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(draft?.candidates ?? regexCandidates).map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setChosenSymbol(sym)}
                    className={
                      chosenSymbol === sym
                        ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-3 py-1 font-mono text-xs font-bold text-[var(--pf-red)]"
                        : "rounded-full border border-[var(--pf-border)] px-3 py-1 font-mono text-xs font-semibold text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)]"
                    }
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Button type="button" disabled={tweetLoading || tweetRaw.trim().length < 12} onClick={() => void draftFromTweet()}>
            {tweetLoading ? "Drafting…" : "Generate desk draft"}
          </Button>

          {tweetError ? <p className="text-xs text-rose-700">{tweetError}</p> : null}

          {draft ? (
            <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Draft only — review before publish
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-800)]">{draft.thesis}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Direction</dt>
                  <dd className="font-semibold">{draft.direction ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Entry</dt>
                  <dd className="font-semibold tabular-nums">{draft.entryPrice ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Target</dt>
                  <dd className="font-semibold tabular-nums">{draft.targetPrice ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Stop</dt>
                  <dd className="font-semibold tabular-nums">{draft.stopPrice ?? "—"}</dd>
                </div>
              </dl>
              {draft.timeframeNote ? (
                <p className="mt-2 text-xs text-[var(--pf-gray-600)]">{draft.timeframeNote}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin?tab=desk">
                  <Button variant="outline" size="sm">
                    Open desk admin
                  </Button>
                </Link>
                <Link href={publishHref}>
                  <Button size="sm">Continue in publish form →</Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
