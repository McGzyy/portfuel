import { ImageResponse } from "next/og";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPlotPng, SOCIAL_CHART_PLOT_SIZE } from "@/lib/charts/social-chart-plot";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { directionMeta, fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import { SOCIAL_CHART_FOOTER_H } from "@/lib/charts/social-chart-logo";
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
  const isMember = payload.spotlightKind === "member";
  const eyebrow = isMember ? "MEMBER CALL" : "FUELED DESK";
  const callType = isMember ? "Community call on record" : "Fueled desk call";
  const sinceLabel = isMember ? "SINCE PUBLICATION" : "SINCE DESK CALL";
  const date = fmtDate(payload.calledAt);
  const up = (ret ?? 0) >= 0;
  const trendColor = up ? T.lineUp : T.lineDown;
  const dir = directionMeta(payload.direction);
  const asOf = fmtSocialAsOf();

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
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "40px 56px 0",
            height: 208,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
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
                {eyebrow}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 58,
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
                fontSize: 22,
                fontWeight: 500,
                color: T.text,
                marginTop: 6,
                letterSpacing: -0.3,
              }}
            >
              {payload.companyName}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 13,
                fontWeight: 600,
                color: T.text,
                marginTop: 8,
              }}
            >
              <span style={{ display: "flex", color: dir.color }}>{dir.label}</span>
              <span style={{ display: "flex", color: T.textDim, marginLeft: 8 }}>·</span>
              <span style={{ display: "flex", color: T.textDim, marginLeft: 8 }}>{callType}</span>
            </div>

            {date ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.textDim,
                  marginTop: 6,
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
                paddingTop: 4,
              }}
            >
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
                  letterSpacing: 1.3,
                }}
              >
                {sinceLabel}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", width: 1 }} />
          )}
        </div>

        <div style={{ display: "flex", height: SOCIAL_CHART_PLOT_SIZE.height, flexShrink: 0 }}>
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
            height: SOCIAL_CHART_FOOTER_H,
            flexShrink: 0,
            padding: "0 56px",
            borderTop: `1px solid ${T.rule}`,
            background: T.surface,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: T.textDim }}>
              Not investment advice · {payload.siteHost}
            </div>
            <div style={{ display: "flex", fontSize: 10, fontWeight: 500, color: T.textDim }}>
              {`As of ${asOf}`}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
