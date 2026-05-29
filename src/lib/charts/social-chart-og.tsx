import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, PriceLine } from "@/lib/charts/types";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";

const W = 1200;
const H = 675;

const C = {
  bg: "#09090b",
  panel: "#131316",
  border: "rgba(255,255,255,0.08)",
  text: "#a1a1aa",
  bright: "#fafafa",
  dim: "#71717a",
  accent: "#E31B23",
  accentBg: "rgba(227,27,35,0.2)",
  long: "#4ade80",
  up: "#26a69a",
  down: "#ef5350",
  entry: "#E31B23",
  target: "#26a69a",
} as const;

function deskLines(lines: PriceLine[]): PriceLine[] {
  const desk = lines.filter((l) => l.label.toLowerCase().startsWith("desk"));
  const src = desk.length ? desk : lines.filter((l) => l.label.toLowerCase().startsWith("your"));
  return src.filter((l) => /entry|target/i.test(l.label));
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function logoSrc(): string | null {
  const path = join(process.cwd(), "public", "logo-social-chrome.png");
  if (!existsSync(path)) return null;
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

function CandleCol({
  candle,
  yMin,
  yMax,
  chartH,
}: {
  candle: CandlePoint;
  yMin: number;
  yMax: number;
  chartH: number;
}) {
  const range = yMax - yMin || 1;
  const y = (p: number) => ((yMax - p) / range) * chartH;
  const up = candle.close >= candle.open;
  const body = up ? C.up : C.down;
  const wick = up ? "#1e8e7e" : "#c62828";
  const top = y(Math.max(candle.open, candle.close));
  const bot = y(Math.min(candle.open, candle.close));
  const bodyH = Math.max(4, bot - top);
  const hi = y(candle.high);
  const lo = y(candle.low);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: chartH,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: hi,
          height: Math.max(0, top - hi),
          width: 2,
          background: wick,
        }}
      />
      <div
        style={{
          position: "absolute",
          top,
          height: bodyH,
          width: 11,
          background: body,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: bot,
          height: Math.max(0, lo - bot),
          width: 2,
          background: wick,
        }}
      />
    </div>
  );
}

export async function renderSocialChartOgPng(payload: SocialChartPayload): Promise<Buffer> {
  const candles = (payload.candles.length > 24 ? payload.candles.slice(-24) : payload.candles) as CandlePoint[];
  const lines = deskLines(payload.priceLines);
  const chartH = 360;

  const pts = candles.flatMap((c) => [c.high, c.low]);
  for (const l of lines) pts.push(l.price);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const pad = (hi - lo) * 0.1 || hi * 0.04 || 1;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const yRange = yMax - yMin || 1;
  const yPx = (p: number) => ((yMax - p) / yRange) * chartH;

  let callIdx = Math.floor(candles.length * 0.28);
  const marker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled");
  if (marker && candles.length > 0) {
    let best = 0;
    let d = Math.abs(candles[0]!.time - marker.time);
    for (let i = 1; i < candles.length; i++) {
      const nd = Math.abs(candles[i]!.time - marker.time);
      if (nd < d) {
        d = nd;
        best = i;
      }
    }
    callIdx = best;
  }
  const callPct = candles.length > 1 ? (callIdx / (candles.length - 1)) * 100 : 30;

  const ret = payload.returnPct != null ? fmtPct(payload.returnPct) : "—";
  const mile = payload.milestoneLabel?.toUpperCase() ?? "";
  const date = fmtDate(payload.calledAt);
  const logo = logoSrc();
  const sub = `${payload.direction.toUpperCase()} · ${payload.companyName}${date ? ` · Desk ${date}` : ""}`;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          padding: "40px 48px 32px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: C.bright, letterSpacing: -1.5, lineHeight: 1 }}>
              {payload.symbol}
            </div>
            <div style={{ fontSize: 15, color: C.text, marginTop: 10 }}>{sub}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {mile ? (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.bright,
                  background: C.accentBg,
                  border: "1px solid #E31B23",
                  borderRadius: 20,
                  padding: "6px 14px",
                  marginBottom: 8,
                }}
              >
                {mile}
              </div>
            ) : (
              <div style={{ height: 0 }} />
            )}
            <div style={{ fontSize: 64, fontWeight: 700, color: C.bright, letterSpacing: -2, lineHeight: 1 }}>
              {ret}
            </div>
            <div style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>since desk call</div>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            background: C.panel,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 20,
            height: 420,
          }}
        >
          <div style={{ display: "flex", flex: 1, position: "relative", flexDirection: "row" }}>
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "row",
                alignItems: "flex-end",
                height: chartH,
                marginRight: 12,
              }}
            >
              {candles.map((c, i) => (
                <CandleCol key={i} candle={c} yMin={yMin} yMax={yMax} chartH={chartH} />
              ))}
            </div>
            <div style={{ display: "flex", width: 52, height: chartH, position: "relative", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 0, right: 0, fontSize: 11, color: C.dim }}>
                {yMax.toFixed(2)}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: chartH / 2,
                  right: 0,
                  fontSize: 11,
                  color: C.dim,
                  transform: "translateY(-50%)",
                }}
              >
                {((yMax + yMin) / 2).toFixed(2)}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: 11, color: C.dim }}>
                {yMin.toFixed(2)}
              </div>
            </div>
            {lines.map((line, i) => {
              const tgt = /target/i.test(line.label);
              const top = yPx(line.price);
              const color = tgt ? C.target : C.entry;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: tgt ? 0 : `${callPct}%`,
                    right: 64,
                    top,
                    height: 2,
                    background: color,
                    opacity: tgt ? 0.65 : 1,
                  }}
                />
              );
            })}
            {lines.map((line, i) => {
              const tgt = /target/i.test(line.label);
              const top = yPx(line.price);
              const color = tgt ? C.target : C.entry;
              return (
                <div
                  key={`l-${i}`}
                  style={{
                    position: "absolute",
                    right: 64,
                    top: top - 12,
                    fontSize: 10,
                    fontWeight: 700,
                    color,
                  }}
                >
                  {tgt ? "Target" : "Entry"}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <div style={{ fontSize: 11, color: C.dim }}>Not investment advice · portfuel.pro</div>
          {logo ? <img src={logo} height={52} alt="" /> : <div />}
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
