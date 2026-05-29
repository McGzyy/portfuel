import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPlotPng, SOCIAL_CHART_PLOT_SIZE } from "@/lib/charts/social-chart-plot";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";

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
  const dirColor = payload.direction === "long" ? "#4ade80" : "#E31B23";

  const response = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #0c0c0e 0%, #09090b 100%)",
          padding: "26px 48px 22px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  fontWeight: 700,
                  color: "#fafafa",
                  letterSpacing: -2,
                }}
              >
                {payload.symbol}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  fontWeight: 700,
                  color: dirColor,
                  marginLeft: 14,
                  padding: "4px 10px",
                  border: `1px solid ${dirColor}`,
                  borderRadius: 4,
                  opacity: 0.9,
                }}
              >
                {payload.direction.toUpperCase()}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 14, color: "#a1a1aa", marginTop: 8 }}>
              {`${payload.companyName}${date ? ` · Desk ${date}` : ""}`}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div
              style={{
                display: mile ? "flex" : "none",
                fontSize: 10,
                fontWeight: 700,
                color: "#fafafa",
                background: "rgba(227,27,35,0.22)",
                border: "1px solid #E31B23",
                borderRadius: 16,
                padding: "5px 12px",
                marginBottom: 10,
                letterSpacing: 0.5,
              }}
            >
              {mile || " "}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 58,
                fontWeight: 700,
                color: "#fafafa",
                letterSpacing: -2,
              }}
            >
              {ret}
            </div>
            <div style={{ display: "flex", fontSize: 12, color: "#71717a", marginTop: 6 }}>
              since desk call
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            overflow: "hidden",
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
            marginTop: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 11, color: "#71717a" }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex" }}>
            {logo ? <img src={logo} height={56} alt="" /> : null}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
