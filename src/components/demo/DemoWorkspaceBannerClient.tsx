"use client";

import { DemoPreviewBar } from "@/components/demo/DemoPreviewBar";
import type { DemoPreviewTier } from "@/lib/demo/tier";
import type { PreviewDataSource } from "@/lib/demo/workspace-preview";

const STORAGE_KEY = "portfuel_demo_source";

export function DemoWorkspaceBannerClient({
  signedIn,
  tier,
}: {
  signedIn?: boolean;
  tier: DemoPreviewTier;
}) {
  return <DemoPreviewBar tier={tier} signedIn={signedIn} />;
}

export function setDemoPreviewSource(source: PreviewDataSource) {
  try {
    sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    /* ignore */
  }
}
