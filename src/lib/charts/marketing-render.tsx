import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import { loadSocialChartLogoBase64 } from "@/lib/charts/social-chart-logo";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import {
  MARKETING_AD_COPY,
  MARKETING_BRAND as T,
  MARKETING_OG_COPY,
  MARKETING_SIZES,
  type MarketingAdVariant,
  type MarketingOgVariant,
  type MarketingSizeKey,
} from "@/lib/marketing/brand-kit";

/** Upward trend — y as fraction of plot height (0 = top, 1 = bottom). */
const TREND_Y = [0.78, 0.76, 0.73, 0.7, 0.66, 0.62, 0.58, 0.52, 0.46, 0.4, 0.34, 0.28, 0.22, 0.16, 0.12];

/** Matches track record share cards — black base, charcoal mid, warm red corner. */
function cardBackground(up = true): string {
  const perfGlow = up
    ? "radial-gradient(ellipse 85% 65% at 16% 40%, rgba(5,150,105,0.12) 0%, transparent 58%)"
    : "radial-gradient(ellipse 85% 65% at 16% 40%, rgba(227,27,35,0.11) 0%, transparent 58%)";
  const brandGlow =
    "radial-gradient(ellipse 55% 45% at 100% 8%, rgba(227,27,35,0.10) 0%, transparent 52%)";
  const base =
    "linear-gradient(168deg, #000000 0%, #080808 42%, #0f0f0f 72%, #140909 100%)";
  return `${perfGlow}, ${brandGlow}, ${base}`;
}

function sparkPath(
  points: number[],
  width: number,
  height: number,
  padX: number,
  padY: number
): string {
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  return points
    .map((yNorm, i) => {
      const x = padX + (i / (points.length - 1)) * innerW;
      const y = padY + yNorm * innerH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function sparkAreaPath(
  points: number[],
  width: number,
  height: number,
  padX: number,
  padY: number
): string {
  const line = sparkPath(points, width, height, padX, padY);
  const innerW = width - padX * 2;
  const bottom = height - padY;
  const rightX = padX + innerW;
  return `${line} L ${rightX.toFixed(1)} ${bottom} L ${padX} ${bottom} Z`;
}

function MarketingSparkline({
  width,
  height,
  entryIndex = 2,
  targetY = 0.28,
  entryLabel = "Entry $128.40",
  targetLabel = "Target $165",
  stopLabel = "Stop $118",
}: {
  width: number;
  height: number;
  entryIndex?: number;
  targetY?: number;
  entryLabel?: string;
  targetLabel?: string;
  stopLabel?: string;
}) {
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const entryX = padX + (entryIndex / (TREND_Y.length - 1)) * innerW;
  const entryY = padY + TREND_Y[entryIndex]! * innerH;
  const targetLineY = padY + targetY * innerH;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "flex" }}
      >
        <line
          x1={padX}
          y1={targetLineY}
          x2={width - padX}
          y2={targetLineY}
          stroke={T.target}
          strokeWidth={1.25}
          strokeDasharray="5 4"
          opacity={0.55}
        />
        <path d={sparkAreaPath(TREND_Y, width, height, padX, padY)} fill={T.areaUp} />
        <path
          d={sparkPath(TREND_Y, width, height, padX, padY)}
          fill="none"
          stroke={T.up}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={entryX} cy={entryY} r={4.5} fill={T.accentRed} stroke="#fff" strokeWidth={1.25} />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          fontSize: 10,
          fontWeight: 600,
          color: T.textDim,
        }}
      >
        <span style={{ display: "flex", color: T.accentRed }}>{entryLabel}</span>
        <span style={{ display: "flex", color: T.up }}>{targetLabel}</span>
        <span style={{ display: "flex" }}>{stopLabel}</span>
      </div>
    </div>
  );
}

function BackgroundShell({
  width,
  height,
  children,
  up = true,
}: {
  width: number;
  height: number;
  children: ReactNode;
  up?: boolean;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        background: cardBackground(up),
        fontFamily: "Inter",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function EyebrowLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 10,
        fontWeight: 600,
        color: T.textDim,
        letterSpacing: 1.6,
      }}
    >
      {label}
    </div>
  );
}

function BulletList({ lines }: { lines: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            fontSize: 16,
            fontWeight: 500,
            color: T.textBright,
            lineHeight: 1.35,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 6,
              height: 6,
              borderRadius: 999,
              background: T.up,
              flexShrink: 0,
              marginTop: 9,
            }}
          />
          {line}
        </div>
      ))}
    </div>
  );
}

function FooterBar({
  pad,
  compact = false,
  logoSrc,
}: {
  pad: number;
  compact?: boolean;
  logoSrc: string | null;
}) {
  const asOf = fmtSocialAsOf();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: compact ? 64 : 72,
        padding: `0 ${pad}px`,
        borderTop: `1px solid ${T.rule}`,
        background: "transparent",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", fontSize: compact ? 10 : 11, fontWeight: 500, color: T.text }}>
          {`Not investment advice · As of ${asOf}`}
        </div>
        <div style={{ display: "flex", fontSize: 10, fontWeight: 500, color: T.textDim }}>
          portfuel.pro
        </div>
      </div>
      {logoSrc ? (
        <img src={logoSrc} height={compact ? 36 : 46} alt="" style={{ display: "flex" }} />
      ) : null}
    </div>
  );
}

type SparkHeroMeta = {
  symbol: string;
  returnPct: string;
  laneLabel: string;
  insight: string;
  lane: "member" | "desk";
  entryLabel: string;
  targetLabel: string;
  stopLabel: string;
};

function PosterSparkHero({
  symbol,
  returnPct,
  laneLabel,
  insight,
  lane = "member",
  entryLabel,
  targetLabel,
  stopLabel,
  chartWidth = 460,
  chartHeight = 148,
  compact = false,
}: SparkHeroMeta & {
  chartWidth?: number;
  chartHeight?: number;
  compact?: boolean;
}) {
  const up = returnPct.startsWith("+");
  const laneColor = lane === "desk" ? T.accentRed : T.textDim;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          display: "flex",
          fontSize: 10,
          fontWeight: 600,
          color: laneColor,
          letterSpacing: 1.4,
        }}
      >
        {laneLabel}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          width: "100%",
          marginTop: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: compact ? 44 : 52,
            fontWeight: 700,
            color: T.textBright,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          {symbol}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div
            style={{
              display: "flex",
              fontSize: compact ? 36 : 44,
              fontWeight: 700,
              color: up ? T.up : T.down,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {returnPct}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 9,
              fontWeight: 600,
              color: T.textDim,
              letterSpacing: 1.1,
              marginTop: 6,
            }}
          >
            SINCE PUBLICATION
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 12,
          fontWeight: 500,
          color: T.text,
          marginTop: 12,
        }}
      >
        {insight}
      </div>
      <div style={{ display: "flex", width: "100%", marginTop: 28 }}>
        <MarketingSparkline
          width={chartWidth}
          height={chartHeight}
          entryLabel={entryLabel}
          targetLabel={targetLabel}
          stopLabel={stopLabel}
        />
      </div>
    </div>
  );
}

function MiniFeedPreview({ compact = false }: { compact?: boolean }) {
  const rows = [
    { sym: "NVDA", ret: "+24.6%", meta: "LONG · Member call", lane: "member" as const },
    { sym: "META", ret: "+11.2%", meta: "LONG · Member call", lane: "member" as const },
    { sym: "CRWD", ret: "+18.4%", meta: "LONG · Fueled desk", lane: "desk" as const },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          display: "flex",
          fontSize: 10,
          fontWeight: 600,
          color: T.textDim,
          letterSpacing: 1.2,
          marginBottom: 14,
        }}
      >
        LIVE FEED PREVIEW
      </div>
      {rows.map((row, i) => {
        const up = row.ret.startsWith("+");
        const border = i < rows.length - 1 ? `1px solid ${T.rule}` : "none";
        return (
          <div
            key={row.sym}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              paddingTop: i === 0 ? 0 : 16,
              paddingBottom: i < rows.length - 1 ? 16 : 0,
              borderBottom: border,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: compact ? 20 : 24,
                  fontWeight: 700,
                  color: T.textBright,
                  letterSpacing: -0.5,
                }}
              >
                {row.sym}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  fontWeight: 600,
                  color: row.lane === "desk" ? T.accentRed : T.textDim,
                }}
              >
                {row.meta}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: compact ? 20 : 24,
                fontWeight: 700,
                color: up ? T.up : T.down,
                letterSpacing: -0.5,
              }}
            >
              {row.ret}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PROOF_SPARK: SparkHeroMeta = {
  symbol: "NVDA",
  returnPct: "+24.6%",
  laneLabel: "MEMBER CALL",
  insight: "18d on board · ranked caller",
  lane: "member",
  entryLabel: "Entry $128.40",
  targetLabel: "Target $165",
  stopLabel: "Stop $118",
};

const DESK_SPARK: SparkHeroMeta = {
  symbol: "CRWD",
  returnPct: "+18.4%",
  laneLabel: "FUELED DESK",
  insight: "House thesis · live marks",
  lane: "desk",
  entryLabel: "Entry $312.00",
  targetLabel: "Target $380",
  stopLabel: "Stop $285",
};

function ogVisual(variant: MarketingOgVariant) {
  if (variant === "home" || variant === "join" || variant === "demo") {
    return <MiniFeedPreview />;
  }
  if (variant === "desk") {
    return <PosterSparkHero {...DESK_SPARK} compact />;
  }
  return <PosterSparkHero {...PROOF_SPARK} />;
}

function adChartMeta(variant: MarketingAdVariant): SparkHeroMeta {
  if (variant === "desk") return DESK_SPARK;
  if (variant === "structure") {
    return {
      symbol: "AAPL",
      returnPct: "+12.8%",
      laneLabel: "MEMBER THESIS",
      insight: "Building · entry zone set in journal",
      lane: "member",
      entryLabel: "Entry $228.50",
      targetLabel: "Target $255",
      stopLabel: "Stop $218",
    };
  }
  return PROOF_SPARK;
}

function logoDataUri(): string | null {
  const b64 = loadSocialChartLogoBase64();
  return b64 ? `data:image/png;base64,${b64}` : null;
}

export async function renderMarketingOgPng(
  variant: MarketingOgVariant = "home"
): Promise<Buffer> {
  const { width, height } = MARKETING_SIZES.og;
  const c = MARKETING_OG_COPY[variant];
  const pad = 52;
  const logoSrc = logoDataUri();

  const response = new ImageResponse(
    (
      <BackgroundShell width={width} height={height}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: 1,
            padding: `${pad}px ${pad}px 24px`,
            gap: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 600,
              justifyContent: "center",
            }}
          >
            <EyebrowLabel label={c.eyebrow} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 44,
                fontWeight: 700,
                color: T.textBright,
                marginTop: 14,
                letterSpacing: -1.4,
                lineHeight: 1.06,
              }}
            >
              {c.headline}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 19,
                fontWeight: 500,
                color: T.text,
                marginTop: 12,
                lineHeight: 1.35,
              }}
            >
              {c.sub}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
              <BulletList lines={c.bullets} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {ogVisual(variant)}
          </div>
        </div>
        <FooterBar pad={pad} logoSrc={logoSrc} />
      </BackgroundShell>
    ),
    { width, height, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}

function AdCopyBlock({
  headline,
  sub,
  compactHeadline = false,
}: {
  headline: string;
  sub: string;
  compactHeadline?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <EyebrowLabel label="PORTFUEL" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: compactHeadline ? 38 : 42,
          fontWeight: 700,
          color: T.textBright,
          marginTop: 14,
          letterSpacing: -1.2,
          lineHeight: 1.08,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: compactHeadline ? 20 : 18,
          fontWeight: 500,
          color: T.text,
          marginTop: 12,
          lineHeight: 1.4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function AdCtaButton({ label, fullWidth = false }: { label: string; fullWidth?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        padding: fullWidth ? "16px 28px" : "14px 26px",
        background: T.accentRed,
        borderRadius: 12,
        fontSize: fullWidth ? 20 : 17,
        fontWeight: 700,
        color: T.textBright,
        alignSelf: fullWidth ? "stretch" : "flex-start",
        justifyContent: fullWidth ? "center" : "flex-start",
      }}
    >
      {label}
    </div>
  );
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
  const pad = sizeKey === "square" ? 48 : 52;
  const isSquare = sizeKey === "square";
  const chartMeta = adChartMeta(opts.variant);
  const logoSrc = logoDataUri();

  const response = new ImageResponse(
    (
      <BackgroundShell width={width} height={height}>
        {isSquare ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: pad,
              gap: 20,
            }}
          >
            <AdCopyBlock headline={headline} sub={copy.sub} compactHeadline />
            <PosterSparkHero {...chartMeta} chartWidth={960} chartHeight={200} compact />
            <AdCtaButton label={copy.cta} fullWidth />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: `${pad}px ${pad}px 20px`,
              gap: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                gap: 40,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 480,
                  justifyContent: "center",
                }}
              >
                <AdCopyBlock headline={headline} sub={copy.sub} />
              </div>

              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PosterSparkHero {...chartMeta} chartWidth={440} chartHeight={160} compact />
              </div>
            </div>

            <AdCtaButton label={copy.cta} />
          </div>
        )}

        <FooterBar pad={pad} compact={isSquare} logoSrc={logoSrc} />
      </BackgroundShell>
    ),
    { width, height, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
