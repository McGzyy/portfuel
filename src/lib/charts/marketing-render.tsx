import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import { loadSocialChartLogoBase64 } from "@/lib/charts/social-chart-logo";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { PF_CHART_SOCIAL as C } from "@/lib/charts/theme";
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

type Posture = "researching" | "building" | "active" | "trimming";

const POSTURE_STYLE: Record<
  Posture,
  { label: string; bg: string; color: string; border: string }
> = {
  researching: {
    label: "Researching",
    bg: "rgba(100, 116, 139, 0.18)",
    color: "#cbd5e1",
    border: "rgba(148, 163, 184, 0.35)",
  },
  building: {
    label: "Building",
    bg: "rgba(56, 189, 248, 0.12)",
    color: "#7dd3fc",
    border: "rgba(56, 189, 248, 0.35)",
  },
  active: {
    label: "Active",
    bg: "rgba(52, 211, 153, 0.14)",
    color: C.lineUp,
    border: "rgba(52, 211, 153, 0.4)",
  },
  trimming: {
    label: "Trimming",
    bg: "rgba(251, 191, 36, 0.14)",
    color: "#fcd34d",
    border: "rgba(251, 191, 36, 0.4)",
  },
};

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
  const padX = 12;
  const padY = 14;
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
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={padX}
            y1={padY + pct * innerH}
            x2={width - padX}
            y2={padY + pct * innerH}
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth={1}
          />
        ))}
        <line
          x1={padX}
          y1={targetLineY}
          x2={width - padX}
          y2={targetLineY}
          stroke={C.target}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={0.75}
        />
        <path
          d={sparkAreaPath(TREND_Y, width, height, padX, padY)}
          fill={C.areaUp}
        />
        <path
          d={sparkPath(TREND_Y, width, height, padX, padY)}
          fill="none"
          stroke={C.lineUp}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={entryX} cy={entryY} r={5} fill={T.accentRed} stroke="#fff" strokeWidth={1.5} />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 10,
          fontWeight: 600,
          color: T.textMuted,
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
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: `linear-gradient(145deg, ${C.bg} 0%, #0f1419 52%, #15101a 100%)`,
        fontFamily: "Inter",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: T.accentRed,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -60,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(227, 27, 35, 0.09)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: -100,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "rgba(52, 211, 153, 0.05)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          display: "flex",
        }}
      />
      {children}
    </div>
  );
}

function EyebrowPill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "flex-start",
        padding: "6px 14px",
        borderRadius: 999,
        border: `1px solid rgba(227, 27, 35, 0.35)`,
        background: "rgba(227, 27, 35, 0.12)",
        fontSize: 10,
        fontWeight: 700,
        color: T.textBright,
        letterSpacing: 1.6,
      }}
    >
      {label}
    </div>
  );
}

function PostureChip({ posture }: { posture: Posture }) {
  const s = POSTURE_STYLE[posture];
  return (
    <div
      style={{
        display: "flex",
        padding: "4px 10px",
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        fontSize: 9,
        fontWeight: 700,
        color: s.color,
        letterSpacing: 0.8,
      }}
    >
      {s.label.toUpperCase()}
    </div>
  );
}

function StatStrip() {
  const items = ["Live marks", "Private journal", "Ranked calls"];
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
      {items.map((item) => (
        <div
          key={item}
          style={{
            display: "flex",
            padding: "5px 12px",
            borderRadius: 999,
            background: C.chipBg,
            border: `1px solid ${C.chipBorder}`,
            fontSize: 10,
            fontWeight: 600,
            color: C.chipText,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function BulletList({ lines }: { lines: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              width: 8,
              height: 8,
              borderRadius: 2,
              background: T.up,
              flexShrink: 0,
              marginTop: 8,
            }}
          />
          {line}
        </div>
      ))}
    </div>
  );
}

function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
      <span style={{ display: "flex", fontSize: size, fontWeight: 700, color: T.textBright }}>
        Port
      </span>
      <span style={{ display: "flex", fontSize: size, fontWeight: 700, color: T.accentRed }}>
        Fuel
      </span>
      <span
        style={{
          display: "flex",
          fontSize: Math.max(10, size * 0.42),
          fontWeight: 700,
          color: T.textMuted,
          letterSpacing: 1.2,
          marginLeft: 4,
        }}
      >
        .PRO
      </span>
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
        height: compact ? 56 : 72,
        padding: `0 ${pad}px`,
        borderTop: `1px solid ${T.rule}`,
        background: C.surface,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", fontSize: compact ? 10 : 11, color: T.text }}>
          Not investment advice · portfuel.pro
        </div>
        <div style={{ display: "flex", fontSize: 10, fontWeight: 500, color: C.textDim }}>
          {`As of ${asOf}`}
        </div>
      </div>
      {logoSrc ? (
        <img
          src={logoSrc}
          height={compact ? 28 : 36}
          alt=""
          style={{ display: "flex" }}
        />
      ) : (
        <LogoMark size={compact ? 18 : 22} />
      )}
    </div>
  );
}

function MockChartCard({
  symbol = "NVDA",
  returnPct = "+24.6%",
  label = "Member call",
  chartHeight = 180,
  compact = false,
  insight = "18d on board · 3 community calls",
  lane = "member",
  posture = "active",
  entryLabel = "Entry $128.40",
  targetLabel = "Target $165",
  stopLabel = "Stop $118",
}: {
  symbol?: string;
  returnPct?: string;
  label?: string;
  chartHeight?: number;
  compact?: boolean;
  insight?: string;
  lane?: "member" | "desk";
  posture?: Posture;
  entryLabel?: string;
  targetLabel?: string;
  stopLabel?: string;
}) {
  const laneColor = lane === "desk" ? T.accentRed : T.textMuted;
  const up = returnPct.startsWith("+");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: 18,
        border: `1px solid ${lane === "desk" ? "rgba(227, 27, 35, 0.35)" : T.rule}`,
        background: "rgba(20, 24, 32, 0.96)",
        padding: compact ? 16 : 20,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                padding: "4px 10px",
                borderRadius: 999,
                background: lane === "desk" ? "rgba(227, 27, 35, 0.14)" : C.chipBg,
                border: `1px solid ${lane === "desk" ? "rgba(227, 27, 35, 0.35)" : C.chipBorder}`,
                fontSize: 9,
                fontWeight: 700,
                color: laneColor,
                letterSpacing: 1.1,
              }}
            >
              {lane === "desk" ? "FUELED DESK" : label.toUpperCase()}
            </div>
            <PostureChip posture={posture} />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: compact ? 28 : 34,
              fontWeight: 700,
              color: T.textBright,
              letterSpacing: -1,
            }}
          >
            {symbol}
          </div>
          <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: T.text }}>
            {insight}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: compact ? 22 : 28,
              fontWeight: 700,
              color: up ? T.up : T.down,
              letterSpacing: -1,
            }}
          >
            {returnPct}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 9,
              fontWeight: 600,
              color: C.textDim,
              letterSpacing: 1.1,
            }}
          >
            SINCE PUBLICATION
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 16,
          borderRadius: 12,
          background: C.bg,
          border: `1px solid ${T.rule}`,
          padding: "12px 12px 8px",
        }}
      >
        <MarketingSparkline
          width={compact ? 420 : 480}
          height={chartHeight - 36}
          entryLabel={entryLabel}
          targetLabel={targetLabel}
          stopLabel={stopLabel}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {["On record", "Live mark", lane === "desk" ? "House thesis" : "Member thesis"].map(
          (tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "4px 10px",
                borderRadius: 999,
                background: C.chipBg,
                border: `1px solid ${C.chipBorder}`,
                fontSize: 10,
                fontWeight: 600,
                color: T.text,
              }}
            >
              {tag}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MiniFeedPreview() {
  const rows = [
    {
      sym: "NVDA",
      ret: "+24.6%",
      dir: "LONG",
      rank: 1,
      lane: "member" as const,
      posture: "trimming" as Posture,
    },
    {
      sym: "META",
      ret: "+11.2%",
      dir: "LONG",
      rank: 2,
      lane: "member" as const,
      posture: "active" as Posture,
    },
    {
      sym: "CRWD",
      ret: "+18.4%",
      dir: "LONG",
      rank: "Desk",
      lane: "desk" as const,
      posture: "active" as Posture,
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {rows.map((row) => {
        const up = row.ret.startsWith("+");
        return (
          <div
            key={row.sym}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderRadius: 14,
              border: `1px solid ${row.lane === "desk" ? "rgba(227, 27, 35, 0.28)" : T.rule}`,
              background: "rgba(20, 24, 32, 0.96)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    row.lane === "desk" ? "rgba(227, 27, 35, 0.16)" : C.chipBg,
                  border: `1px solid ${row.lane === "desk" ? "rgba(227, 27, 35, 0.35)" : C.chipBorder}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: row.lane === "desk" ? T.accentRed : T.text,
                }}
              >
                {String(row.rank)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 18,
                      fontWeight: 700,
                      color: T.textBright,
                    }}
                  >
                    {row.sym}
                  </div>
                  <PostureChip posture={row.posture} />
                </div>
                <div style={{ display: "flex", fontSize: 11, fontWeight: 600, color: T.text }}>
                  {row.lane === "desk" ? "Fueled desk · LONG" : `${row.dir} · Member call`}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                fontWeight: 700,
                color: up ? T.up : T.down,
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

function ogVisual(variant: MarketingOgVariant) {
  if (variant === "home" || variant === "join") {
    return <MiniFeedPreview />;
  }
  if (variant === "desk") {
    return (
      <MockChartCard
        symbol="CRWD"
        returnPct="+18.4%"
        label="Fueled desk"
        insight="House thesis · live marks"
        lane="desk"
        posture="active"
        entryLabel="Entry $312.00"
        targetLabel="Target $380"
        stopLabel="Stop $285"
        chartHeight={168}
        compact
      />
    );
  }
  return (
    <MockChartCard
      chartHeight={200}
      insight="18d on board · ranked caller"
      posture="active"
      compact={false}
    />
  );
}

function adChartMeta(variant: MarketingAdVariant) {
  if (variant === "desk") {
    return {
      symbol: "CRWD",
      returnPct: "+18.4%",
      label: "Fueled desk",
      insight: "House thesis · live marks",
      lane: "desk" as const,
      posture: "active" as Posture,
      entryLabel: "Entry $312.00",
      targetLabel: "Target $380",
      stopLabel: "Stop $285",
    };
  }
  if (variant === "structure") {
    return {
      symbol: "AAPL",
      returnPct: "+12.8%",
      label: "Member thesis",
      insight: "Building · entry zone set in journal",
      lane: "member" as const,
      posture: "building" as Posture,
      entryLabel: "Entry $228.50",
      targetLabel: "Target $255",
      stopLabel: "Stop $218",
    };
  }
  return {
    symbol: "NVDA",
    returnPct: "+24.6%",
    label: "Member call",
    insight: "Trimming into strength · call on record",
    lane: "member" as const,
    posture: "trimming" as Posture,
    entryLabel: "Entry $128.40",
    targetLabel: "Target $165",
    stopLabel: "Stop $118",
  };
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
            padding: `${pad}px ${pad}px 28px`,
            gap: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 620,
              justifyContent: "center",
              gap: 0,
            }}
          >
            <EyebrowPill label={c.eyebrow} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 44,
                fontWeight: 700,
                color: T.textBright,
                marginTop: 18,
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
            <StatStrip />
            <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
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
      <EyebrowPill label="PORTFUEL" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: compactHeadline ? 38 : 42,
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
          flexDirection: "column",
          fontSize: compactHeadline ? 20 : 18,
          fontWeight: 500,
          color: T.text,
          marginTop: 14,
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
        boxShadow: "0 10px 30px rgba(227, 27, 35, 0.35)",
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
            <MockChartCard
              symbol={chartMeta.symbol}
              returnPct={chartMeta.returnPct}
              label={chartMeta.label}
              insight={chartMeta.insight}
              lane={chartMeta.lane}
              posture={chartMeta.posture}
              entryLabel={chartMeta.entryLabel}
              targetLabel={chartMeta.targetLabel}
              stopLabel={chartMeta.stopLabel}
              chartHeight={280}
              compact
            />
            <AdCtaButton label={copy.cta} fullWidth />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: `${pad}px ${pad}px 24px`,
              gap: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                gap: 36,
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
                <MockChartCard
                  symbol={chartMeta.symbol}
                  returnPct={chartMeta.returnPct}
                  label={chartMeta.label}
                  insight={chartMeta.insight}
                  lane={chartMeta.lane}
                  posture={chartMeta.posture}
                  entryLabel={chartMeta.entryLabel}
                  targetLabel={chartMeta.targetLabel}
                  stopLabel={chartMeta.stopLabel}
                  chartHeight={260}
                />
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
