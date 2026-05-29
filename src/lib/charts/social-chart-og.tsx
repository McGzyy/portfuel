import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPlotPng, SOCIAL_CHART_PLOT_SIZE } from "@/lib/charts/social-chart-plot";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
const W = 1200;
const H = 675;

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 2 : 4;
  return `$${n.toFixed(digits)}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function resolveEntry(payload: SocialChartPayload): number | null {
  const desk = payload.priceLines.find((l) => /desk.*entry/i.test(l.label));
  const entry = desk ?? payload.priceLines.find((l) => /entry/i.test(l.label));
  if (entry) return entry.price;
  const mark = payload.markers.find((m) => m.kind === "fueled");
  return mark?.price ?? null;
}

function logoSrc(): string | null {
  const path = join(process.cwd(), "public", "logo-social-chrome.png");
  if (!existsSync(path)) return null;
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

export async function renderSocialChartOgPng(payload: SocialChartPayload): Promise<Buffer> {
  const plotPng = await renderSocialChartPlotPng(payload);
  const plotSrc = `data:image/png;base64,${plotPng.toString("base64")}`;

  const candles = payload.candles;
  const lastPrice = candles[candles.length - 1]?.close ?? 0;
  const entry = resolveEntry(payload);
  const dollarChange = entry != null ? lastPrice - entry : null;
  const ret = payload.returnPct;
  const retStr = ret != null ? fmtPct(ret) : "—";
  const mile = payload.milestoneLabel ?? "";
  const date = fmtDate(payload.calledAt);
  const logo = logoSrc();
  const up = (ret ?? 0) >= 0;
  const trendColor = up ? T.lineUp : T.lineDown;

  const changeLine =
    dollarChange != null && ret != null
      ? `${dollarChange >= 0 ? "+" : "-"}${fmtUsd(Math.abs(dollarChange))} (${fmtPct(ret)}) since desk call`
      : `${retStr} since desk call`;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: T.bg,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px 0",
          }}
        >
          <div style={{ display: "flex", fontSize: 13, fontWeight: 500, color: T.text }}>
            {payload.symbol}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: T.textBright,
              marginTop: 4,
              maxWidth: 720,
            }}
          >
            {payload.companyName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 700,
                color: T.textBright,
                letterSpacing: -2,
              }}
            >
              {fmtUsd(lastPrice)}
            </div>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: T.text, marginLeft: 10 }}>
              USD
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 600,
              color: trendColor,
              marginTop: 8,
            }}
          >
            {changeLine}
          </div>
          {mile ? (
            <div style={{ display: "flex", fontSize: 13, color: T.textDim, marginTop: 6 }}>
              {mile}
              {date ? ` · Desk ${date}` : ""}
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 13, color: T.textDim, marginTop: 6 }}>
              {date ? `Desk call · ${date}` : "PortFuel Fueled desk"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", marginTop: 8 }}>
          <img
            src={plotSrc}
            width={SOCIAL_CHART_PLOT_SIZE.width}
            height={SOCIAL_CHART_PLOT_SIZE.height}
            alt=""
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            padding: "16px 48px 28px",
          }}
        >
          <div style={{ display: "flex", fontSize: 11, color: T.textDim }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex", opacity: 0.92 }}>
            {logo ? <img src={logo} height={44} alt="" /> : null}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
