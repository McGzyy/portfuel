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

export async function renderSocialChartOgPng(payload: SocialChartPayload): Promise<Buffer> {
  const plotPng = await renderSocialChartPlotPng(payload);
  const plotSrc = `data:image/png;base64,${plotPng.toString("base64")}`;

  const ret = payload.returnPct != null ? fmtPct(payload.returnPct) : "—";
  const mile = payload.milestoneLabel?.toUpperCase() ?? "";
  const date = fmtDate(payload.calledAt);
  const logo = logoSrc();
  const isLong = payload.direction === "long";
  const dirColor = isLong ? T.long : T.accent;
  const retColor = payload.returnPct != null && payload.returnPct >= 0 ? T.long : "#fb7185";

  const response = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: T.bgGradient,
          padding: "24px 44px 20px",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            right: 0,
            width: 520,
            height: 320,
            background: "radial-gradient(circle at 100% 0%, rgba(227,27,35,0.28) 0%, transparent 68%)",
          }}
        />

        <div style={{ display: "flex", fontSize: 10, fontWeight: 600, color: T.eyebrow, letterSpacing: 1.6 }}>
          FUELED DESK · MILESTONE
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 10,
            marginBottom: 12,
            padding: "16px 20px",
            borderRadius: 12,
            border: `1px solid ${T.glassBorder}`,
            background: T.glass,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 700,
                  color: T.textBright,
                  letterSpacing: -1.5,
                }}
              >
                {payload.symbol}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 11,
                  fontWeight: 700,
                  color: dirColor,
                  marginLeft: 12,
                  padding: "4px 10px",
                  border: `1px solid ${isLong ? T.longBorder : "rgba(227,27,35,0.45)"}`,
                  borderRadius: 6,
                  background: isLong ? "rgba(5,150,105,0.12)" : T.accentFill,
                  letterSpacing: 0.8,
                }}
              >
                {payload.direction.toUpperCase()}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 13, color: T.text, marginTop: 6 }}>
              {`${payload.companyName}${date ? ` · Called ${date}` : ""}`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${T.glassBorder}`,
              background: "rgba(0,0,0,0.2)",
              boxShadow: "0 0 0 1px rgba(227,27,35,0.12), 0 8px 32px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: mile ? "flex" : "none",
                fontSize: 9,
                fontWeight: 700,
                color: T.textBright,
                background: T.accentFill,
                border: `1px solid ${T.accent}`,
                borderRadius: 14,
                padding: "4px 10px",
                marginBottom: 8,
                letterSpacing: 0.6,
              }}
            >
              {mile || " "}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 700,
                color: retColor,
                letterSpacing: -2,
              }}
            >
              {ret}
            </div>
            <div style={{ display: "flex", fontSize: 11, color: T.textDim, marginTop: 4 }}>
              since desk call
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderRadius: 12,
            border: `1px solid ${T.panelBorder}`,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
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
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${T.rule}`,
          }}
        >
          <div style={{ display: "flex", fontSize: 11, color: T.textDim }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex" }}>
            {logo ? <img src={logo} height={54} alt="" /> : null}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
