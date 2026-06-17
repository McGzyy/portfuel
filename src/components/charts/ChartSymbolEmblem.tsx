import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import type { ChartAvatarEmblemKind } from "@/components/charts/ChartAvatarEmblem";
import { cn } from "@/lib/utils";
import type { AssetClass } from "@/lib/market/validate-symbol";

const RING: Record<ChartAvatarEmblemKind, string> = {
  long: "ring-2 ring-emerald-500 shadow-[0_0_0_1px_rgba(5,150,105,0.25)]",
  short: "ring-2 ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,0.2)]",
  fueled: "ring-[2.5px] ring-[var(--pf-red)] shadow-[0_0_0_1px_rgba(227,27,35,0.35)]",
  journal: "ring-2 ring-indigo-500",
  win: "ring-2 ring-emerald-500",
  loss: "ring-2 ring-rose-500",
  flat: "ring-2 ring-slate-400",
};

const SIZES = {
  sm: "h-[22px] w-[22px]",
  md: "h-[26px] w-[26px]",
} as const;

export function ChartSymbolEmblem({
  symbol,
  assetClass,
  kind = "long",
  size = "md",
  title,
  className,
}: {
  symbol: string;
  assetClass?: AssetClass;
  kind?: ChartAvatarEmblemKind;
  size?: keyof typeof SIZES;
  title?: string;
  className?: string;
}) {
  const sym = symbol.toUpperCase();
  return (
    <span
      className={cn(
        "pf-chart-symbol-emblem relative inline-flex shrink-0 rounded-full bg-[var(--pf-surface)]",
        RING[kind],
        SIZES[size],
        className
      )}
      title={title ?? sym}
    >
      <SymbolAvatar symbol={sym} assetClass={assetClass} size="xs" className="h-full w-full" />
    </span>
  );
}
