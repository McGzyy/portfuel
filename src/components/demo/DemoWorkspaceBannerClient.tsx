"use client";

import { useEffect, useState } from "react";
import { DemoWorkspaceBanner } from "@/components/demo/DemoWorkspaceBanner";
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
  const [source, setSource] = useState<PreviewDataSource | undefined>();

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "live" || stored === "sample") {
      setSource(stored);
    }
  }, []);

  return <DemoWorkspaceBanner source={source} signedIn={signedIn} tier={tier} />;
}

export function setDemoPreviewSource(source: PreviewDataSource) {
  try {
    sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    /* ignore */
  }
}
