"use client";

import { useRouter } from "next/navigation";
import { PanelErrorState } from "@/components/errors/PanelErrorState";

export function WatchlistLoadError() {
  const router = useRouter();
  return (
    <PanelErrorState
      title="Watchlist couldn\u2019t load"
      message="Your saved symbols didn\u2019t load this time. Refresh the page or try again in a moment."
      onRetry={() => router.refresh()}
    />
  );
}
