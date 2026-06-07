"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AI_BACKGROUND_PROMPT,
  AI_NEGATIVE_PROMPT,
  AI_STYLE_RULES,
  FIGMA_CHECKLIST,
  MARKETING_AD_COPY,
  MARKETING_OG_COPY,
  MARKETING_SIZES,
  type MarketingAdVariant,
  type MarketingOgVariant,
} from "@/lib/marketing/brand-kit";

const OG_VARIANTS: MarketingOgVariant[] = ["home", "join", "proof", "desk", "demo"];
const AD_VARIANTS: MarketingAdVariant[] = ["proof", "structure", "desk"];

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--pf-gray-700)]">{label}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--pf-gray-600)]">
        {text}
      </pre>
    </div>
  );
}

function AssetCard({
  title,
  subtitle,
  previewUrl,
  downloadUrl,
  cacheKey,
}: {
  title: string;
  subtitle: string;
  previewUrl: string;
  downloadUrl: string;
  cacheKey: number;
}) {
  const src = `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}v=${cacheKey}`;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--pf-border)] bg-white">
      <div className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
        <p className="text-sm font-semibold text-[var(--pf-black)]">{title}</p>
        <p className="text-xs text-[var(--pf-gray-500)]">{subtitle}</p>
      </div>
      <div className="bg-[var(--pf-gray-100)] p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="w-full rounded-lg border border-[var(--pf-border)]" />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--pf-border)] p-3">
        <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secondary" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download PNG
          </Button>
        </a>
        <a href={src} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="ghost" size="sm">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open
          </Button>
        </a>
      </div>
    </div>
  );
}

export function AdminMarketingPanel() {
  const [cacheKey, setCacheKey] = useState(0);
  const [callId, setCallId] = useState("");
  const [adHeadline, setAdHeadline] = useState("");
  const [adVariant, setAdVariant] = useState<MarketingAdVariant>("proof");

  const chartUrl = useMemo(() => {
    const id = callId.trim();
    if (!id) return "";
    return `/api/social/chart/${encodeURIComponent(id)}?format=png`;
  }, [callId]);

  const customAdUrl = useMemo(() => {
    const params = new URLSearchParams({ variant: adVariant, size: "x" });
    if (adHeadline.trim()) params.set("headline", adHeadline.trim());
    return `/api/og/ad?${params.toString()}`;
  }, [adVariant, adHeadline]);

  const refresh = useCallback(() => setCacheKey((k) => k + 1), []);

  return (
    <div className="mt-8 space-y-8">
      <section className="pf-workspace-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Brand system
            </p>
            <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">Marketing assets</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
              On-brand PNGs generated from code — same colors and typography as social charts and
              the app. Use real call charts for proof posts; use these templates for link previews,
              paid ads, and Figma compositing.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh previews
          </Button>
        </div>
        <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
          Full workflow in repo: <code className="rounded bg-[var(--pf-gray-100)] px-1">docs/BRAND-KIT.md</code>
          {" · "}
          <code className="rounded bg-[var(--pf-gray-100)] px-1">npm run marketing:export</code>
        </p>
      </section>

      <section>
        <h3 className="text-sm font-bold text-[var(--pf-black)]">Link preview cards (1200×630)</h3>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          {MARKETING_SIZES.og.label} — homepage, join, proof, desk, demo angles.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {OG_VARIANTS.map((variant) => (
            <AssetCard
              key={variant}
              title={MARKETING_OG_COPY[variant].headline}
              subtitle={`OG · variant=${variant}`}
              previewUrl={`/api/og/marketing?variant=${variant}`}
              downloadUrl={`/api/og/marketing?variant=${variant}`}
              cacheKey={cacheKey}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-[var(--pf-black)]">Paid social ad cards</h3>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Landscape (1200×675) and square (1080×1080). Drop a real chart PNG into Figma over the
          placeholder, or pair with{" "}
          <code className="rounded bg-[var(--pf-gray-100)] px-1">/api/social/chart/&#123;callId&#125;</code>.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {AD_VARIANTS.map((variant) => (
            <AssetCard
              key={variant}
              title={MARKETING_AD_COPY[variant].headline}
              subtitle={`X landscape · variant=${variant}`}
              previewUrl={`/api/og/ad?variant=${variant}&size=x`}
              downloadUrl={`/api/og/ad?variant=${variant}&size=x`}
              cacheKey={cacheKey}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {AD_VARIANTS.map((variant) => (
            <AssetCard
              key={`sq-${variant}`}
              title={`${MARKETING_AD_COPY[variant].headline} (square)`}
              subtitle={`Square · variant=${variant}`}
              previewUrl={`/api/og/ad?variant=${variant}&size=square`}
              downloadUrl={`/api/og/ad?variant=${variant}&size=square`}
              cacheKey={cacheKey}
            />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[var(--pf-border)] bg-white p-4">
          <p className="text-sm font-semibold text-[var(--pf-black)]">Custom headline ad</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ad-variant">Variant</Label>
              <select
                id="ad-variant"
                value={adVariant}
                onChange={(e) => setAdVariant(e.target.value as MarketingAdVariant)}
                className="mt-1 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
              >
                {AD_VARIANTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ad-headline">Headline override (optional)</Label>
              <Input
                id="ad-headline"
                value={adHeadline}
                onChange={(e) => setAdHeadline(e.target.value)}
                placeholder={MARKETING_AD_COPY[adVariant].headline}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-3">
            <AssetCard
              title="Custom ad preview"
              subtitle={customAdUrl}
              previewUrl={customAdUrl}
              downloadUrl={customAdUrl}
              cacheKey={cacheKey}
            />
          </div>
        </div>
      </section>

      <section className="pf-workspace-panel p-5 sm:p-6">
        <h3 className="text-sm font-bold text-[var(--pf-black)]">Call chart PNG builder</h3>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Best-performing creative: real call data on the dark/white social chart template.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="call-id">Call ID</Label>
            <Input
              id="call-id"
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              placeholder="uuid from calls table or demo-call-…"
              className="mt-1 font-mono text-sm"
            />
          </div>
          {chartUrl ? (
            <a href={chartUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" size="sm">
                Open chart PNG
              </Button>
            </a>
          ) : null}
        </div>
        {chartUrl ? (
          <div className="mt-4">
            <AssetCard
              title="Social chart"
              subtitle={chartUrl}
              previewUrl={chartUrl}
              downloadUrl={chartUrl}
              cacheKey={cacheKey}
            />
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="pf-workspace-panel p-5 sm:p-6">
          <h3 className="text-sm font-bold text-[var(--pf-black)]">AI background prompts</h3>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Use only for backdrop plates — composite product PNGs on top in Figma. Lock style with
            Midjourney <code className="rounded bg-[var(--pf-gray-100)] px-1">--sref</code> from one
            approved master image.
          </p>
          <div className="mt-4 space-y-3">
            <CopyBlock label="Master background prompt" text={AI_BACKGROUND_PROMPT} />
            <CopyBlock label="Negative prompt" text={AI_NEGATIVE_PROMPT} />
          </div>
        </div>

        <div className="pf-workspace-panel p-5 sm:p-6">
          <h3 className="text-sm font-bold text-[var(--pf-black)]">Brand rules</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--pf-gray-600)]">
            {AI_STYLE_RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pf-red)]" />
                {rule}
              </li>
            ))}
          </ul>
          <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Figma checklist
          </h4>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-[var(--pf-gray-600)]">
            {FIGMA_CHECKLIST.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-5 py-4 text-sm text-[var(--pf-gray-600)]">
        <p className="font-semibold text-[var(--pf-black)]">Recommended weekly workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Export top chart PNGs from Social → Milestones or member wins.</li>
          <li>Download ad card + OG variants above (or run npm run marketing:export).</li>
          <li>In Figma: chart left, headline/CTA right, logo + disclaimer bar.</li>
          <li>Post organically; boost best performer with UTM paid links from MARKETING-ASSETS.md.</li>
        </ol>
      </section>
    </div>
  );
}
