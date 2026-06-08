import { ImageResponse } from "next/og";
import type { TrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

const W = 1200;
const H = 675;
const PAD = 52;

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

function buildEquityPath(
  points: number[],
  width: number,
  height: number,
  padX: number,
  padY: number
): { line: string; area: string; endY: number } {
  if (points.length < 2) {
    const midY = height / 2 + padY;
    return {
      line: `M ${padX} ${midY} L ${width - padX} ${midY}`,
      area: `M ${padX} ${midY} L ${width - padX} ${midY} L ${width - padX} ${height - padY} L ${padX} ${height - padY} Z`,
      endY: midY,
    };
  }

  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const span = max - min || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((value, index) => {
    const x = padX + (index / (points.length - 1)) * innerW;
    const y = padY + innerH - ((value - min) / span) * innerH;
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1]!.x.toFixed(1)} ${(height - padY).toFixed(1)} L ${coords[0]!.x.toFixed(1)} ${(height - padY).toFixed(1)} Z`;

  return { line, area, endY: coords[coords.length - 1]!.y };
}

export async function renderTrackRecordCardOgPng(
  payload: TrackRecordCardPayload
): Promise<Buffer> {
  const pad = PAD;
  const avgColor =
    payload.avgReturnPct != null && payload.avgReturnPct >= 0 ? T.lineUp : T.lineDown;
  const heroValue =
    payload.avgReturnPct != null
      ? fmtPct(payload.avgReturnPct)
      : payload.winRatePct != null
        ? `${payload.winRatePct}%`
        : String(payload.callCount);
  const heroLabel =
    payload.avgReturnPct != null
      ? "AVG RETURN"
      : payload.winRatePct != null
        ? "WIN RATE"
        : "CALLS ON RECORD";

  const chartW = W - pad * 2;
  const chartH = 248;
  const curve = buildEquityPath(payload.equityCurve, chartW, chartH, 8, 16);
  const curveUp = (payload.equityCurve.at(-1) ?? 0) >= 0;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(145deg, #0a0c10 0%, #0f1419 52%, #15101a 100%)",
          fontFamily: "Inter",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: `${pad}px ${pad}px 0`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 600,
                color: T.textDim,
                letterSpacing: 1.4,
              }}
            >
              PORTFUEL · VERIFIED TRACK RECORD
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 14,
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 44,
                  fontWeight: 700,
                  color: T.textBright,
                  letterSpacing: -1.5,
                }}
              >
                @{payload.username}
              </div>
              {payload.trusted ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.accent,
                    background: T.accentFill,
                    border: `1px solid ${T.accentBorder}`,
                    borderRadius: 999,
                    padding: "5px 12px",
                    letterSpacing: 0.4,
                  }}
                >
                  TRUSTED
                </div>
              ) : null}
            </div>
            {payload.displayName !== payload.username ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 500,
                  color: T.text,
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
                color: T.textDim,
                marginTop: 8,
              }}
            >
              {payload.callCount} verified call{payload.callCount === 1 ? "" : "s"} · timestamped
              theses · live marks
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              paddingTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 700,
                color: avgColor,
                letterSpacing: -2.5,
                lineHeight: 1,
              }}
            >
              {heroValue}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 600,
                color: T.textDim,
                marginTop: 8,
                letterSpacing: 1.3,
              }}
            >
              {heroLabel}
            </div>
          </div>
        </div>

        {/* Equity curve */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: `20px ${pad}px 0`,
            padding: "18px 20px 14px",
            background: T.surface,
            border: `1px solid ${T.rule}`,
            borderRadius: 16,
            height: chartH + 52,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 600,
                color: T.textDim,
                letterSpacing: 1.2,
              }}
            >
              CUMULATIVE RETURN · CALL BY CALL
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: 600,
                color: curveUp ? T.lineUp : T.lineDown,
              }}
            >
              {fmtPct(payload.equityCurve.at(-1) ?? null)} total
            </div>
          </div>
          <svg
            width={chartW - 40}
            height={chartH}
            viewBox={`0 0 ${chartW - 40} ${chartH}`}
          >
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={8}
                y1={16 + (chartH - 32) * ratio}
                x2={chartW - 48}
                y2={16 + (chartH - 32) * ratio}
                stroke={T.grid}
                strokeWidth={1}
              />
            ))}
            <path d={curve.area} fill={curveUp ? T.areaUp : T.areaDown} />
            <path
              d={curve.line}
              fill="none"
              stroke={curveUp ? T.lineUp : T.lineDown}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Stats + highlights row */}
        <div
          style={{
            display: "flex",
            gap: 14,
            padding: `16px ${pad}px 0`,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", gap: 10, flex: 1 }}>
            {[
              { label: "CALLS", value: String(payload.callCount) },
              {
                label: "WIN RATE",
                value: payload.winRatePct != null ? `${payload.winRatePct}%` : "—",
              },
              {
                label: "BEST",
                value: fmtPct(payload.bestReturnPct),
                color:
                  payload.bestReturnPct != null && payload.bestReturnPct >= 0
                    ? T.lineUp
                    : T.lineDown,
              },
              { label: "RANK", value: String(Math.round(payload.rankScore)) },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  background: T.chipBg,
                  border: `1px solid ${T.chipBorder}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 9,
                    fontWeight: 600,
                    color: T.textDim,
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 700,
                    color: stat.color ?? T.textBright,
                    marginTop: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 380,
              background: T.surface,
              border: `1px solid ${T.rule}`,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 10,
                fontWeight: 600,
                color: T.textDim,
                letterSpacing: 1.1,
                marginBottom: 10,
              }}
            >
              TOP CALLS
            </div>
            {payload.highlights.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  fontSize: 13,
                  color: T.text,
                }}
              >
                Publish calls to populate your card.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {payload.highlights.map((h) => {
                  const up = (h.returnPct ?? 0) >= 0;
                  return (
                    <div
                      key={`${h.symbol}-${h.calledAt}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: T.chipBg,
                        border: `1px solid ${T.chipBorder}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              display: "flex",
                              fontSize: 16,
                              fontWeight: 700,
                              color: T.textBright,
                            }}
                          >
                            ${h.symbol}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              fontSize: 10,
                              fontWeight: 700,
                              color: h.direction === "long" ? T.long : T.down,
                              letterSpacing: 0.4,
                            }}
                          >
                            {h.direction.toUpperCase()}
                          </div>
                        </div>
                        {h.calledAt ? (
                          <div
                            style={{
                              display: "flex",
                              fontSize: 10,
                              fontWeight: 500,
                              color: T.textDim,
                            }}
                          >
                            {fmtShortDate(h.calledAt)}
                          </div>
                        ) : null}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 18,
                          fontWeight: 700,
                          color: up ? T.lineUp : T.lineDown,
                        }}
                      >
                        {fmtPct(h.returnPct)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${T.rule}`,
            padding: `16px ${pad}px`,
            marginTop: 14,
            background: T.surface,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 500,
                color: T.textDim,
              }}
            >
              Not investment advice · community verified performance
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 10,
                fontWeight: 500,
                color: T.textDim,
              }}
            >
              Download & share your public track record
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 14,
              fontWeight: 700,
              color: T.accent,
              letterSpacing: -0.2,
            }}
          >
            {payload.siteHost}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
