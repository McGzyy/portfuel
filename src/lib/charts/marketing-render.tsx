import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
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

const SPARK_HEIGHTS = [38, 44, 41, 52, 48, 58, 54, 68, 72, 78, 85, 92, 88, 96, 100];

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
        background: `linear-gradient(145deg, ${T.bg} 0%, #121820 42%, #0c1018 100%)`,
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
          background: T.accent,
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
          background: "rgba(227, 27, 35, 0.11)",
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
          background: "rgba(5, 150, 105, 0.06)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
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
      <span style={{ display: "flex", fontSize: size, fontWeight: 700, color: T.accent }}>
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

function FooterBar({ pad, compact = false }: { pad: number; compact?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: compact ? 52 : 72,
        padding: `0 ${pad}px`,
        borderTop: `1px solid ${T.rule}`,
        background: "rgba(26, 35, 50, 0.92)",
      }}
    >
      <div style={{ display: "flex", fontSize: compact ? 10 : 11, color: T.textMuted }}>
        Not investment advice · portfuel.pro
      </div>
      <LogoMark size={compact ? 18 : 22} />
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
}: {
  symbol?: string;
  returnPct?: string;
  label?: string;
  chartHeight?: number;
  compact?: boolean;
  insight?: string;
  lane?: "member" | "desk";
}) {
  const laneColor = lane === "desk" ? T.accent : T.textMuted;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: 18,
        border: `1px solid ${lane === "desk" ? "rgba(227, 27, 35, 0.35)" : T.rule}`,
        background: "rgba(26, 35, 50, 0.92)",
        padding: compact ? 16 : 20,
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
                padding: "4px 10px",
                borderRadius: 999,
                background: lane === "desk" ? "rgba(227, 27, 35, 0.14)" : "rgba(15, 20, 25, 0.55)",
                border: `1px solid ${lane === "desk" ? "rgba(227, 27, 35, 0.35)" : T.rule}`,
                fontSize: 9,
                fontWeight: 700,
                color: laneColor,
                letterSpacing: 1.1,
              }}
            >
              {lane === "desk" ? "FUELED DESK" : label.toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: compact ? 24 : 28, fontWeight: 700, color: T.textBright }}>
            {symbol}
          </div>
          <div style={{ display: "flex", fontSize: 11, fontWeight: 500, color: T.textMuted }}>
            {insight}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(5, 150, 105, 0.14)",
            border: `1px solid rgba(5, 150, 105, 0.35)`,
            fontSize: compact ? 16 : 18,
            fontWeight: 700,
            color: T.up,
          }}
        >
          {returnPct}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          height: chartHeight,
          marginTop: 16,
          borderRadius: 12,
          background: T.surfaceAlt,
          border: `1px solid ${T.rule}`,
          padding: "14px 16px 12px",
          position: "relative",
        }}
      >
        {[0.25, 0.5, 0.75].map((pct) => (
          <div
            key={pct}
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: `${pct * 100}%`,
              height: 1,
              background: "rgba(148, 163, 184, 0.12)",
              display: "flex",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: "58%",
            height: 2,
            background: T.accent,
            opacity: 0.85,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: "28%",
            height: 1,
            borderTop: "2px dashed rgba(148, 163, 184, 0.35)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: chartHeight - 40,
            position: "relative",
          }}
        >
          {SPARK_HEIGHTS.map((h, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flex: 1,
                height: `${h}%`,
                borderRadius: 3,
                background:
                  i >= SPARK_HEIGHTS.length - 4
                    ? T.up
                    : i >= SPARK_HEIGHTS.length - 7
                      ? "rgba(5, 150, 105, 0.55)"
                      : "rgba(148, 163, 184, 0.32)",
                opacity: i >= SPARK_HEIGHTS.length - 6 ? 1 : 0.85,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
            fontSize: 10,
            fontWeight: 600,
            color: T.textMuted,
          }}
        >
          <span style={{ display: "flex", color: T.accent }}>Entry $128.40</span>
          <span style={{ display: "flex", color: T.up }}>Target $165</span>
          <span style={{ display: "flex" }}>Stop $118</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        {["Since publication", "On record", "Live mark"].map((tag) => (
          <div
            key={tag}
            style={{
              display: "flex",
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(15, 20, 25, 0.55)",
              border: `1px solid ${T.rule}`,
              fontSize: 10,
              fontWeight: 600,
              color: T.textMuted,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniFeedPreview() {
  const rows = [
    { sym: "NVDA", ret: "+24.6%", dir: "LONG", rank: 1, lane: "member" as const },
    { sym: "META", ret: "+11.2%", dir: "LONG", rank: 2, lane: "member" as const },
    { sym: "CRWD", ret: "+18.4%", dir: "LONG", rank: "Desk", lane: "desk" as const },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
      }}
    >
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
              background: "rgba(26, 35, 50, 0.92)",
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
                    row.lane === "desk" ? "rgba(227, 27, 35, 0.16)" : "rgba(15, 20, 25, 0.55)",
                  border: `1px solid ${row.lane === "desk" ? "rgba(227, 27, 35, 0.35)" : T.rule}`,
                  fontSize: 10,
                  fontWeight: 700,
                  color: row.lane === "desk" ? T.accent : T.textMuted,
                }}
              >
                {String(row.rank)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: T.textBright }}>
                  {row.sym}
                </div>
                <div style={{ display: "flex", fontSize: 11, fontWeight: 600, color: T.textMuted }}>
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
        chartHeight={160}
        compact
      />
    );
  }
  return <MockChartCard chartHeight={200} insight="18d on board · ranked caller" compact={false} />;
}

function adChartMeta(variant: MarketingAdVariant) {
  if (variant === "desk") {
    return {
      symbol: "CRWD",
      returnPct: "+18.4%",
      label: "Fueled desk",
      insight: "House thesis · live marks",
      lane: "desk" as const,
    };
  }
  if (variant === "structure") {
    return {
      symbol: "AAPL",
      returnPct: "+12.8%",
      label: "Member thesis",
      insight: "Entry / target / stop on record",
      lane: "member" as const,
    };
  }
  return {
    symbol: "NVDA",
    returnPct: "+24.6%",
    label: "Member call",
    insight: "18d on board · ranked caller",
    lane: "member" as const,
  };
}

export async function renderMarketingOgPng(
  variant: MarketingOgVariant = "home"
): Promise<Buffer> {
  const { width, height } = MARKETING_SIZES.og;
  const c = MARKETING_OG_COPY[variant];
  const pad = 52;

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
        <FooterBar pad={pad} />
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
        background: T.accent,
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
                  chartHeight={260}
                />
              </div>
            </div>

            <AdCtaButton label={copy.cta} />
          </div>
        )}

        <FooterBar pad={pad} compact={isSquare} />
      </BackgroundShell>
    ),
    { width, height, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
