"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AssetClass } from "@/lib/market/validate-symbol";

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-[11px]",
  lg: "h-11 w-11 text-xs",
} as const;

function symbolHue(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash + symbol.charCodeAt(i) * (i + 1)) % 360;
  }
  return hash;
}

function logoSrc(symbol: string, assetClass?: AssetClass): string {
  const params = assetClass ? `?assetClass=${assetClass}` : "";
  return `/api/market/logo/${encodeURIComponent(symbol.toUpperCase())}${params}`;
}

export function SymbolAvatar({
  symbol,
  assetClass,
  size = "sm",
  className,
  title,
}: {
  symbol: string;
  assetClass?: AssetClass;
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}) {
  const sym = symbol.toUpperCase();
  const [failed, setFailed] = useState(false);
  const hue = symbolHue(sym);
  const label = title ?? sym;

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc(sym, assetClass)}
        alt=""
        title={label}
        onError={() => setFailed(true)}
        className={cn(
          "pf-symbol-avatar inline-block shrink-0 rounded-full bg-white object-cover ring-1 ring-[var(--pf-border)]",
          SIZES[size],
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "pf-symbol-avatar inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight text-white ring-1 ring-[var(--pf-border)]",
        SIZES[size],
        className
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 48% 42%) 0%, hsl(${hue} 46% 32%) 100%)`,
      }}
      title={label}
      aria-hidden
    >
      {sym.slice(0, 2)}
    </span>
  );
}
