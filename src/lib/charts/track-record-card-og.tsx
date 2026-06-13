import { ImageResponse } from "next/og";
import type { TrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import { renderTrackRecordSparkPng, SPARK_W } from "@/lib/charts/track-record-card-spark";
import { SOCIAL_CHART_FOOTER_H } from "@/lib/charts/social-chart-logo";
import { MARKETING_BRAND as B } from "@/lib/marketing/brand-kit";

const W = 1200;
const H = 675;
const PAD = 48;

function cardBackground(up: boolean): string {
  const perfGlow = up
    ? "radial-gradient(ellipse 80% 60% at 14% 38%, rgba(5,150,105,0.14) 0%, transparent 58%)"
    : "radial-gradient(ellipse 80% 60% at 14% 38%, rgba(227,27,35,0.12) 0%, transparent 58%)";
  const brandGlow =
    "radial-gradient(ellipse 50% 40% at 100% 6%, rgba(227,27,35,0.12) 0%, transparent 52%)";
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
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${B.rule}`,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 10,
          fontWeight: 600,
          color: B.textDim,
          letterSpacing: 1.2,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 700,
          color: B.textBright,
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        {value}
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
  const totalReturn = fmtPct(
    payload.equityCurve.length > 0 ? payload.equityCurve[payload.equityCurve.length - 1]! : hero
  );

  const sparkPng = await renderTrackRecordSparkPng(payload.equityCurve, up);
  const sparkSrc = `data:image/png;base64,${sparkPng.toString("base64")}`;

  const asOf = fmtSocialAsOf();
  const highlights = payload.highlights.slice(0, 2);
  const subtitle = `${payload.callCount} verified call${payload.callCount === 1 ? "" : "s"} · timestamped theses · live marks`;

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
            padding: `${36}px ${PAD}px 0`,
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
            <div
              style={{
                display: "flex",
                fontSize: 10,
                fontWeight: 600,
                color: B.textDim,
                letterSpacing: 1.4,
              }}
            >
              PORTFUEL · VERIFIED TRACK RECORD
            </div>
            {payload.trusted ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fecaca",
                  background: "rgba(227,27,35,0.18)",
                  border: "1px solid rgba(227,27,35,0.35)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  letterSpacing: 0.8,
                }}
              >
                TRUSTED
              </div>
            ) : null}
          </div>

          {/* Identity + hero return */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
              marginTop: 20,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 40,
                  fontWeight: 700,
                  color: B.textBright,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                @{payload.username}
              </div>
              {payload.displayName !== payload.username ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 500,
                    color: B.text,
                    marginTop: 6,
                  }}
                >
                  {payload.displayName}
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  fontWeight: 500,
                  color: B.textDim,
                  marginTop: 10,
                }}
              >
                {subtitle}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 600,
                  color: B.textDim,
                  letterSpacing: 1.4,
                  marginBottom: 8,
                }}
              >
                AVG RETURN
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 72,
                  fontWeight: 700,
                  color: heroColor,
                  letterSpacing: -3,
                  lineHeight: 0.95,
                }}
              >
                {fmtPct(hero)}
              </div>
            </div>
          </div>

          {/* Chart panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 28,
              width: "100%",
              borderRadius: 14,
              border: `1px solid ${B.rule}`,
              background: "rgba(255,255,255,0.02)",
              padding: "16px 18px 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 10,
                  fontWeight: 600,
                  color: B.textDim,
                  letterSpacing: 1.2,
                }}
              >
                CUMULATIVE RETURN · CALL BY CALL
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 700,
                  color: heroColor,
                }}
              >
                {totalReturn} total
              </div>
            </div>
            <img src={sparkSrc} width={SPARK_W} height={88} alt="" style={{ objectFit: "contain" }} />
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", width: "100%", gap: 12, marginTop: 18 }}>
            <StatBox value={String(payload.callCount)} label="CALLS" />
            <StatBox value={winRate} label="WIN RATE" />
            <StatBox value={fmtPct(payload.bestReturnPct)} label="BEST" />
            <StatBox value={`#${Math.round(payload.rankScore)}`} label="RANK" />
          </div>

          {/* Top calls */}
          {highlights.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 22, width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 10,
                  fontWeight: 600,
                  color: B.textDim,
                  letterSpacing: 1.2,
                  marginBottom: 12,
                }}
              >
                TOP CALLS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {highlights.map((h) => {
                  const retUp = (h.returnPct ?? 0) >= 0;
                  const dirColor = h.direction === "long" ? B.up : B.down;
                  return (
                    <div
                      key={`${h.symbol}-${h.calledAt}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {h.logoDataUrl ? (
                          <img
                            src={h.logoDataUrl}
                            width={36}
                            height={36}
                            alt=""
                            style={{ borderRadius: 999, objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              width: 36,
                              height: 36,
                              borderRadius: 999,
                              background: B.surfaceRaised,
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: B.textBright,
                            }}
                          >
                            {h.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                display: "flex",
                                fontSize: 22,
                                fontWeight: 700,
                                color: B.textBright,
                              }}
                            >
                              ${h.symbol}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                fontSize: 11,
                                fontWeight: 700,
                                color: dirColor,
                                letterSpacing: 0.6,
                              }}
                            >
                              {h.direction.toUpperCase()}
                            </div>
                          </div>
                          {h.calledAt ? (
                            <div
                              style={{
                                display: "flex",
                                fontSize: 11,
                                fontWeight: 500,
                                color: B.textDim,
                                marginTop: 2,
                              }}
                            >
                              {fmtShortDate(h.calledAt)}
                            </div>
                          ) : null}
                        </div>
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
          }}
        >
          <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: B.textDim }}>
            Not investment advice · community verified performance
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
            Track record as of {asOf} · download & share from your profile · {payload.siteHost}
            /member/{payload.username}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
