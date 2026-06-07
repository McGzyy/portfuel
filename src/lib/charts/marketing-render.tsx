import { ImageResponse } from "next/og";
import {
  MARKETING_AD_COPY,
  MARKETING_BRAND as T,
  MARKETING_OG_COPY,
  MARKETING_SIZES,
  type MarketingAdVariant,
  type MarketingOgVariant,
  type MarketingSizeKey,
} from "@/lib/marketing/brand-kit";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";

function FooterBar({ pad }: { pad: number }) {
  return (
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
        <span style={{ display: "flex", fontSize: 22, fontWeight: 700, color: T.textBright }}>
          Port
        </span>
        <span style={{ display: "flex", fontSize: 22, fontWeight: 700, color: T.accent }}>
          Fuel
        </span>
      </div>
    </div>
  );
}

function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <span style={{ display: "flex", fontSize: size, fontWeight: 700, color: T.textBright }}>
        Port
      </span>
      <span style={{ display: "flex", fontSize: size, fontWeight: 700, color: T.accent }}>
        Fuel
      </span>
    </div>
  );
}

export async function renderMarketingOgPng(
  variant: MarketingOgVariant = "home"
): Promise<Buffer> {
  const { width, height } = MARKETING_SIZES.og;
  const c = MARKETING_OG_COPY[variant];
  const pad = 56;

  const response = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
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
        <FooterBar pad={pad} />
      </div>
    ),
    { width, height, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}

export async function renderMarketingAdPng(opts: {
  variant: MarketingAdVariant;
  size?: MarketingSizeKey;
  headline?: string;
}): Promise<Buffer> {
  const sizeKey = opts.size ?? "x";
  const { width, height } = MARKETING_SIZES[sizeKey];
  const copy = MARKETING_AD_COPY[opts.variant];
  const headline = opts.headline?.trim().slice(0, 120) || copy.headline;
  const pad = sizeKey === "square" ? 64 : 56;
  const isSquare = sizeKey === "square";

  const response = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          background: T.bg,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isSquare ? "column" : "row",
            flex: 1,
            padding: pad,
            gap: isSquare ? 32 : 40,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: isSquare ? 0 : 1,
              justifyContent: "center",
              width: isSquare ? width - pad * 2 : 520,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 600,
                color: T.text,
                letterSpacing: 1.4,
              }}
            >
              PORTFUEL
            </div>
            <div
              style={{
                display: "flex",
                fontSize: isSquare ? 52 : 44,
                fontWeight: 700,
                color: T.textBright,
                marginTop: 16,
                letterSpacing: -1.2,
                lineHeight: 1.08,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: isSquare ? 22 : 19,
                fontWeight: 500,
                color: T.text,
                marginTop: 16,
                lineHeight: 1.35,
              }}
            >
              {copy.sub}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                padding: "14px 28px",
                background: T.accent,
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 700,
                color: T.textBright,
                alignSelf: "flex-start",
              }}
            >
              {copy.cta}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
              height: isSquare ? 380 : 320,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: isSquare ? 340 : 280,
                borderRadius: 16,
                border: `1px solid ${T.rule}`,
                background: T.surface,
                padding: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: T.textBright }}>
                  NVDA | Member call
                </div>
                <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: T.up }}>
                  +24.6%
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  height: isSquare ? 200 : 160,
                  marginTop: 12,
                  borderRadius: 10,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.rule}`,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: 3,
                    background: T.up,
                    borderRadius: 2,
                    width: "85%",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    color: T.text,
                    marginTop: 12,
                  }}
                >
                  Drop chart PNG from Admin Social
                </div>
              </div>
              <div style={{ display: "flex", fontSize: 11, color: T.text, marginTop: 12 }}>
                Entry | Target | Stop | Since publication
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 56,
            padding: `0 ${pad}px`,
            borderTop: `1px solid ${T.rule}`,
            background: T.surface,
          }}
        >
          <div style={{ display: "flex", fontSize: 10, color: T.text }}>
            Not investment advice
          </div>
          <LogoMark size={18} />
        </div>
      </div>
    ),
    { width, height, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
