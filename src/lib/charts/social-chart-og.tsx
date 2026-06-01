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
            padding: "40px 48px 0",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
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
                  padding: "4px 12px",
                  letterSpacing: 0.6,
                  marginBottom: 16,
                }}
              >
                {mile.toUpperCase()}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 700,
                color: T.textBright,
                letterSpacing: -3,
                lineHeight: 1,
              }}
            >
              {payload.symbol}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 500,
                color: T.text,
                marginTop: 10,
                letterSpacing: -0.3,
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
                  marginTop: 8,
                }}
              >
                {`Desk call · ${date}`}
              </div>
            ) : null}
          </div>

          {retStr ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 56,
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
                  marginTop: 8,
                  letterSpacing: 1.4,
                }}
              >
                SINCE DESK CALL
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", width: 1 }} />
          )}
        </div>

        <div
          style={{
            display: "flex",
            height: 1,
            background: T.rule,
            margin: "28px 48px 0",
          }}
        />

        <div style={{ display: "flex", marginTop: 4 }}>
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
          <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: T.textDim }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex", width: 200, height: 1 }} />
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
