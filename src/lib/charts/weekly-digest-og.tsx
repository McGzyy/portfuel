import { ImageResponse } from "next/og";
import type { WeeklyDigestRow } from "@/lib/social/weekly-digest";
import { socialChartOgFonts } from "@/lib/charts/social-chart-og-fonts";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

const W = 1200;
const H = 675;

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export async function renderWeeklyDigestOgPng(
  rows: WeeklyDigestRow[]
): Promise<Buffer> {
  const display = rows.slice(0, 3);
  const pad = 56;

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
            flexDirection: "column",
            padding: `${pad}px ${pad}px 24px`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 11,
              fontWeight: 600,
              color: T.textDim,
              letterSpacing: 1.4,
            }}
          >
            PORTFUEL · WEEK IN REVIEW
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 700,
              color: T.textBright,
              marginTop: 12,
              letterSpacing: -1.5,
            }}
          >
            Community calls on record
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 500,
              color: T.text,
              marginTop: 8,
            }}
          >
            Top member performance · last 7 days
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 20,
            padding: `0 ${pad}px`,
          }}
        >
          {display.map((row) => {
            const up = row.returnPct >= 0;
            return (
              <div
                key={`${row.symbol}-${row.handle}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  background: T.surface,
                  border: `1px solid ${T.rule}`,
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 36,
                    fontWeight: 700,
                    color: T.textBright,
                    letterSpacing: -1,
                  }}
                >
                  ${row.symbol}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.textDim,
                    marginTop: 8,
                    textTransform: "uppercase",
                  }}
                >
                  {row.direction}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 40,
                    fontWeight: 700,
                    color: up ? T.lineUp : T.lineDown,
                    marginTop: 20,
                    letterSpacing: -1,
                  }}
                >
                  {fmtPct(row.returnPct)}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 12,
                    fontWeight: 500,
                    color: T.textDim,
                    marginTop: 16,
                  }}
                >
                  {row.handle}
                </div>
              </div>
            );
          })}
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
          <div style={{ display: "flex", fontSize: 11, color: T.textDim }}>
            Not investment advice · portfuel.pro
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 700,
                color: T.textBright,
              }}
            >
              Port
            </span>
            <span
              style={{
                display: "flex",
                fontSize: 20,
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
    { width: W, height: H, fonts: socialChartOgFonts() }
  );

  return Buffer.from(await response.arrayBuffer());
}
