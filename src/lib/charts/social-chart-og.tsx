import { ImageResponse } from "next/og";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPlotPng, SOCIAL_CHART_PLOT_SIZE } from "@/lib/charts/social-chart-plot";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { SOCIAL_CHART_LOGO_HEIGHT } from "@/lib/charts/social-chart-logo";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

const W = 1200;
const H = 675;

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export async function renderSocialChartOgPng(payload: SocialChartPayload): Promise<Buffer> {
  const plotPng = await renderSocialChartPlotPng(payload);
  const plotSrc = `data:image/png;base64,${plotPng.toString("base64")}`;

  const ret = payload.returnPct;
  const retStr = ret != null ? fmtPct(ret) : null;
  const mile = payload.milestoneLabel ?? "";
  const date = fmtDate(payload.calledAt);
  const up = (ret ?? 0) >= 0;
  const trendColor = up ? T.lineUp : T.lineDown;

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
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "44px 56px 0",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              {mile ? (
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
                    letterSpacing: 0.5,
                    marginRight: 12,
                  }}
                >
                  {mile.toUpperCase()}
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.textDim,
                  letterSpacing: 1.2,
                }}
              >
                FUELED DESK
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 60,
                fontWeight: 700,
                color: T.textBright,
                letterSpacing: -2.5,
                lineHeight: 1,
              }}
            >
              {payload.symbol}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 500,
                color: T.text,
                marginTop: 8,
                letterSpacing: -0.4,
              }}
            >
              {payload.companyName}
            </div>

            {date ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.textDim,
                  marginTop: 10,
                }}
              >
                {`Called ${date}`}
              </div>
            ) : null}
          </div>

          {retStr ? (
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
                  fontSize: 58,
                  fontWeight: 700,
                  color: trendColor,
                  letterSpacing: -2.5,
                  lineHeight: 1,
                }}
              >
                {retStr}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.textDim,
                  marginTop: 10,
                  letterSpacing: 1.3,
                }}
              >
                SINCE DESK CALL
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", width: 1 }} />
          )}
        </div>

        <div style={{ display: "flex", marginTop: 24 }}>
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
            padding: "20px 56px 36px",
            borderTop: `1px solid ${T.rule}`,
          }}
        >
          <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: T.textDim }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex", width: 200, height: SOCIAL_CHART_LOGO_HEIGHT }} />
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
