"use client";

import { useEffect } from "react";
import { setDemoPreviewSource } from "@/components/demo/DemoWorkspaceBannerClient";
import type { PreviewDataSource } from "@/lib/demo/workspace-preview";

export function DemoPreviewSourceSync({ source }: { source: PreviewDataSource }) {
  useEffect(() => {
    setDemoPreviewSource(source);
  }, [source]);
  return null;
}
