import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseAppTimestamp } from "@/lib/time/timestamp";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const decimals = abs > 0 && abs < 0.1 ? 3 : 2;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? parseAppTimestamp(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 0) return "just now";
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
