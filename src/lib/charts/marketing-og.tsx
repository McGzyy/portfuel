import { ImageResponse } from "next/og";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";

export const MARKETING_OG_WIDTH = 1200;
export const MARKETING_OG_HEIGHT = 630;

const T = {
  bg: "#0f1419",
  surface: "#1a2332",
  text: "#94a3b8",
  textBright: "#f8fafc",
  accent: "#e31b23",
  rule: "#2d3748",
  up: "#059669",
};

export type MarketingOgVariant = "home" | "join";

const COPY: Record<
  MarketingOgVariant,
  { eyebrow: string; headline: string; sub: string; bullets: string[] }
> = {
  home: {
    eyebrow: "PORTFUEL",
    headline: "Intelligence for serious traders",
    sub: "Attributed calls · live performance · community rankings",
    bullets: [
      "Publish theses with entry, target, and stop",
      "Public highlights only after performance gates",
      "Fueled desk research + member track records",
    ],
  },
  join: {
    eyebrow: "PORTFUEL",
    headline: "Join the member workspace",
    sub: "Track calls. Build reputation. Prove results on record.",
    bullets: [
      "Live return % on every published call",
      "Ticker intel, rankings, and Pro research tools",
      "Optional X spotlight when your call qualifies",
    ],
  },
};

export async function renderMarketingOgPng(
  variant: MarketingOgVariant = "home"
): Promise<Buffer> {
  const c = COPY[variant];
  const pad = 56;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: MARKETING_OG_WIDTH,
          height: MARKETING_OG_HEIGHT,
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
            padding: `${pad}px ${pad}px 32px`,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 11,
              fontWeight: 600,
              color: T.text,
              letterSpacing: 1.6,
            }}
          >
            {c.eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 700,
              color: T.textBright,
              marginTop: 16,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {c.headline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 500,
              color: T.text,
              marginTop: 14,
            }}
          >
            {c.sub}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 36,
            }}
          >
            {c.bullets.map((line) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 17,
                  fontWeight: 500,
                  color: T.textBright,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: T.up,
                  }}
                />
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 72,
            padding: `0 ${pad}px`,
            borderTop: `1px solid ${T.rule}`,
            background: T.surface,
          }}
        >
          <div style={{ display: "flex", fontSize: 11, color: T.text }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: T.textBright,
              }}
            >
              Port
            </span>
            <span
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: T.accent,
              }}
            >
              Fuel
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: MARKETING_OG_WIDTH,
      height: MARKETING_OG_HEIGHT,
      fonts: socialChartOgFonts(),
    }
  );

  return Buffer.from(await response.arrayBuffer());
}
