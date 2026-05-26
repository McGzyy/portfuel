import type { FinnhubCandle } from "@/lib/market/finnhub";
import type { CandlePoint } from "@/lib/charts/types";

export function finnhubCandlesToPoints(raw: FinnhubCandle | null): CandlePoint[] {
  if (!raw?.t?.length) return [];
  return raw.t.map((t, i) => ({
    time: t,
    open: raw.o[i],
    high: raw.h[i],
    low: raw.l[i],
    close: raw.c[i],
    volume: raw.v?.[i] != null ? Number(raw.v[i]) : undefined,
  }));
}
