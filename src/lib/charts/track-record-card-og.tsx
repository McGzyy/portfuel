import { ImageResponse } from "next/og";
import type { TrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import { renderTrackRecordSparkPng, SPARK_H, SPARK_W } from "@/lib/charts/track-record-card-spark";
import { SOCIAL_CHART_FOOTER_H } from "@/lib/charts/social-chart-logo";
import { MARKETING_BRAND as B } from "@/lib/marketing/brand-kit";

const W = 1200;
const H = 675;
const PAD = 56;

/** Subtle PortFuel atmosphere — black base, charcoal mid, warm red corner. */
function cardBackground(up: boolean): string {
  const perfGlow = up
    ? "radial-gradient(ellipse 85% 65% at 16% 40%, rgba(5,150,105,0.12) 0%, transparent 58%)"
    : "radial-gradient(ellipse 85% 65% at 16% 40%, rgba(227,27,35,0.11) 0%, transparent 58%)";
  const brandGlow =
    "radial-gradient(ellipse 55% 45% at 100% 8%, rgba(227,27,35,0.10) 0%, transparent 52%)";
  const base =
    "linear-gradient(168deg, #000000 0%, #080808 42%, #0f0f0f 72%, #140909 100%)";
  return `${perfGlow}, ${brandGlow}, ${base}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          fontWeight: 700,
          color: B.textBright,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 10,
          fontWeight: 600,
          color: B.textDim,
          marginTop: 6,
          letterSpacing: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export async function renderTrackRecordCardOgPng(
  payload: TrackRecordCardPayload
): Promise<Buffer> {
  const hero =
    payload.avgReturnPct ??
    (payload.equityCurve.length > 0 ? payload.equityCurve[payload.equityCurve.length - 1]! : null);
  const up = (hero ?? 0) >= 0;
  const heroColor = up ? B.up : B.down;
  const winRate = payload.winRatePct != null ? `${payload.winRatePct}%` : "—";

  const sparkPng = await renderTrackRecordSparkPng(payload.equityCurve, up);
  const sparkSrc = `data:image/png;base64,${sparkPng.toString("base64")}`;

  const asOf = fmtSocialAsOf();
  const highlights = payload.highlights.slice(0, 3);
  const totalReturn = fmtPct(
    payload.equityCurve.length > 0 ? payload.equityCurve[payload.equityCurve.length - 1]! : hero
  );

  const response = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: cardBackground(up),
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `${40}px ${PAD}px 0`,
          }}
        >
          {/* Identity + rank / win */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 42,
                  fontWeight: 700,
                  color: B.textBright,
                  letterSpacing: -1.2,
                  lineHeight: 1,
                }}
              >
                @{payload.username}
              </div>
              {payload.displayName !== payload.username ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 17,
                    fontWeight: 500,
                    color: B.text,
                    marginTop: 6,
                  }}
                >
                  {payload.displayName}
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 44 }}>
              <StatBlock value={`#${Math.round(payload.rankScore)}`} label="RANK" />
              <StatBlock value={winRate} label="WIN RATE" />
            </div>
          </div>

          {/* Hero — Binance-style flex number */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 44, width: "100%" }}>
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 600,
                color: B.textDim,
                letterSpacing: 1.6,
                marginBottom: 10,
              }}
            >
              AVG RETURN PER CALL
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 108,
                fontWeight: 700,
                color: heroColor,
                letterSpacing: -5,
                lineHeight: 0.95,
              }}
            >
              {fmtPct(hero)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 500,
                color: B.textMuted,
                marginTop: 16,
              }}
            >
              {payload.callCount} closed call{payload.callCount === 1 ? "" : "s"} · {totalReturn}{" "}
              cumulative · {fmtPct(payload.bestReturnPct)} best
            </div>
          </div>

          {/* Equity curve */}
          <div style={{ display: "flex", width: "100%", marginTop: 28 }}>
            <img src={sparkSrc} width={SPARK_W} height={SPARK_H} alt="" />
          </div>

          {/* Top calls — inline columns, no boxes */}
          {highlights.length > 1 ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 32, width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 10,
                  fontWeight: 600,
                  color: B.textDim,
                  letterSpacing: 1.2,
                  marginBottom: 14,
                }}
              >
                TOP CALLS
              </div>
              <div style={{ display: "flex", width: "100%", gap: 0 }}>
                {highlights.map((h, i) => {
                  const retUp = (h.returnPct ?? 0) >= 0;
                  const dirColor = h.direction === "long" ? B.up : B.down;
                  const border =
                    i < highlights.length - 1
                      ? `1px solid ${B.rule}`
                      : "none";
                  return (
                    <div
                      key={`${h.symbol}-${h.calledAt}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        paddingRight: i < highlights.length - 1 ? 20 : 0,
                        paddingLeft: i > 0 ? 20 : 0,
                        borderRight: border,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            fontSize: 24,
                            fontWeight: 700,
                            color: B.textBright,
                          }}
                        >
                          ${h.symbol}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            fontSize: 24,
                            fontWeight: 700,
                            color: retUp ? B.up : B.down,
                            letterSpacing: -0.5,
                          }}
                        >
                          {fmtPct(h.returnPct)}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 12,
                          fontWeight: 600,
                          color: B.textDim,
                          marginTop: 6,
                        }}
                      >
                        <span style={{ display: "flex", color: dirColor, marginRight: 6 }}>
                          {h.direction.toUpperCase()}
                        </span>
                        {h.calledAt ? fmtShortDate(h.calledAt) : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: SOCIAL_CHART_FOOTER_H,
            flexShrink: 0,
            padding: `0 ${PAD}px`,
            borderTop: `1px solid ${B.rule}`,
            background: "transparent",
          }}
        >
          <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: B.text }}>
            {`Not investment advice · As of ${asOf}`}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 10,
              fontWeight: 500,
              color: B.textDim,
              marginTop: 5,
            }}
          >
            {`${payload.siteHost}/member/${payload.username}`}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
