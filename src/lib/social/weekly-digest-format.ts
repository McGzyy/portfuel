/** Client-safe weekly digest row shape and formatters (no DB/chart imports). */

export type WeeklyDigestRow = {
  symbol: string;
  direction: string;
  returnPct: number;
  handle: string;
};

export function formatWeeklyDigestLineX(row: WeeklyDigestRow, index: number): string {
  const ret = `${row.returnPct >= 0 ? "+" : ""}${row.returnPct.toFixed(1)}%`;
  return `${index + 1}. $${row.symbol} ${row.direction} · ${ret} · ${row.handle}`;
}

export function formatWeeklyDigestLineDiscord(row: WeeklyDigestRow, index: number): string {
  const ret = `${row.returnPct >= 0 ? "+" : ""}${row.returnPct.toFixed(1)}%`;
  const dir = row.direction.toUpperCase();
  return `**${index + 1}.** **${row.symbol}** ${dir} **${ret}** — ${row.handle}`;
}
