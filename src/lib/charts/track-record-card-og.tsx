import { ImageResponse } from "next/og";
import type { TrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

const W = 1200;
const H = 675;

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export async function renderTrackRecordCardOgPng(
  payload: TrackRecordCardPayload
): Promise<Buffer> {
  const pad = 56;
  const avgColor =
    payload.avgReturnPct != null && payload.avgReturnPct >= 0 ? T.lineUp : T.lineDown;
  const bestColor =
    payload.bestReturnPct != null && payload.bestReturnPct >= 0 ? T.lineUp : T.lineDown;

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
            padding: `${pad}px ${pad}px 20px`,
          }}
        >
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
                fontSize: 40,
                fontWeight: 700,
                color: T.textBright,
                letterSpacing: -1.2,
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
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            padding: `0 ${pad}px`,
          }}
        >
          {[
            { label: "CALLS", value: String(payload.callCount) },
            {
              label: "WIN RATE",
              value: payload.winRatePct != null ? `${payload.winRatePct}%` : "—",
            },
            { label: "AVG RETURN", value: fmtPct(payload.avgReturnPct), color: avgColor },
            { label: "BEST CALL", value: fmtPct(payload.bestReturnPct), color: bestColor },
            { label: "RANK SCORE", value: String(Math.round(payload.rankScore)) },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: T.surface,
                border: `1px solid ${T.rule}`,
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 10,
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
                  fontSize: 28,
                  fontWeight: 700,
                  color: stat.color ?? T.textBright,
                  marginTop: 8,
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
            flex: 1,
            flexDirection: "column",
            padding: `24px ${pad}px ${pad}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 11,
              fontWeight: 600,
              color: T.textDim,
              letterSpacing: 1.2,
              marginBottom: 12,
            }}
          >
            TOP CALLS ON RECORD
          </div>
          {payload.highlights.length === 0 ? (
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: T.text,
                background: T.surface,
                border: `1px solid ${T.rule}`,
                borderRadius: 12,
              }}
            >
              Publish calls to build a shareable track record.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {payload.highlights.map((h) => {
                const up = (h.returnPct ?? 0) >= 0;
                return (
                  <div
                    key={`${h.symbol}-${h.direction}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: T.surface,
                      border: `1px solid ${T.rule}`,
                      borderRadius: 12,
                      padding: "14px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 22,
                          fontWeight: 700,
                          color: T.textBright,
                        }}
                      >
                        ${h.symbol}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 12,
                          fontWeight: 600,
                          color: h.direction === "long" ? T.long : T.down,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {h.direction}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 24,
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${T.rule}`,
            padding: `18px ${pad}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              color: T.textDim,
            }}
          >
            Timestamped theses · live marks · community verified
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 700,
              color: T.accent,
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
