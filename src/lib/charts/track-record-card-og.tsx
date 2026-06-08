import { ImageResponse } from "next/og";
import type { TrackRecordCardPayload } from "@/lib/charts/track-record-card-data";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import {
  renderTrackRecordPlotPng,
  TRACK_RECORD_PLOT_SIZE,
} from "@/lib/charts/track-record-card-plot";
import { SOCIAL_CHART_FOOTER_H } from "@/lib/charts/social-chart-logo";
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
  const plotPng = await renderTrackRecordPlotPng({
    equityCurve: payload.equityCurve,
    highlights: payload.highlights,
    callCount: payload.callCount,
    winRatePct: payload.winRatePct,
    avgReturnPct: payload.avgReturnPct,
    bestReturnPct: payload.bestReturnPct,
    rankScore: payload.rankScore,
  });
  const plotSrc = `data:image/png;base64,${plotPng.toString("base64")}`;

  const totalReturn =
    payload.equityCurve.length > 0
      ? payload.equityCurve[payload.equityCurve.length - 1]!
      : payload.avgReturnPct;
  const heroValue = fmtPct(totalReturn ?? null);
  const heroColor =
    totalReturn != null ? (totalReturn >= 0 ? T.lineUp : T.lineDown) : T.textBright;

  const asOf = fmtSocialAsOf();
  const callLine = `${payload.callCount} verified call${payload.callCount === 1 ? "" : "s"}`;

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
        <div
          style={{
            display: "flex",
            width: W,
            height: 3,
            background: "#e31b23",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "38px 56px 0",
            height: 205,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.textDim,
                  letterSpacing: 1.4,
                }}
              >
                PORTFUEL
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 500,
                  color: T.textDim,
                  marginLeft: 8,
                  marginRight: 8,
                }}
              >
                ·
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.textDim,
                  letterSpacing: 1.2,
                }}
              >
                VERIFIED TRACK RECORD
              </div>
              {payload.trusted ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 9,
                    fontWeight: 700,
                    color: T.accent,
                    background: T.accentFill,
                    border: `1px solid ${T.accentBorder}`,
                    borderRadius: 999,
                    padding: "4px 10px",
                    letterSpacing: 0.4,
                    marginLeft: 14,
                  }}
                >
                  TRUSTED
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 700,
                color: T.textBright,
                letterSpacing: -2.2,
                lineHeight: 1,
              }}
            >
              @{payload.username}
            </div>

            {payload.displayName !== payload.username ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 21,
                  fontWeight: 500,
                  color: T.text,
                  marginTop: 8,
                  letterSpacing: -0.2,
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
                marginTop: 10,
              }}
            >
              {callLine}
              <span style={{ display: "flex", marginLeft: 8, marginRight: 8 }}>·</span>
              timestamped theses
              <span style={{ display: "flex", marginLeft: 8, marginRight: 8 }}>·</span>
              live marks
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              paddingTop: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 58,
                fontWeight: 700,
                color: heroColor,
                letterSpacing: -2.8,
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
              AVG RETURN
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            height: TRACK_RECORD_PLOT_SIZE.height,
            flexShrink: 0,
          }}
        >
          <img
            src={plotSrc}
            width={TRACK_RECORD_PLOT_SIZE.width}
            height={TRACK_RECORD_PLOT_SIZE.height}
            alt=""
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: SOCIAL_CHART_FOOTER_H,
            flexShrink: 0,
            padding: "0 56px",
            borderTop: `1px solid ${T.rule}`,
            background: T.surface,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: T.textDim }}>
              Not investment advice · community verified performance
            </div>
            <div style={{ display: "flex", fontSize: 10, fontWeight: 500, color: T.textDim }}>
              {`Track record as of ${asOf} · download & share from your profile`}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
