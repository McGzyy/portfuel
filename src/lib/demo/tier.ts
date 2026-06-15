import { cookies } from "next/headers";

export type DemoPreviewTier = "member" | "pro";

export const DEMO_TIER_COOKIE = "portfuel_demo_tier";

export function parseDemoPreviewTier(value: string | undefined | null): DemoPreviewTier {
  return value === "pro" ? "pro" : "member";
}

export async function getDemoPreviewTier(): Promise<DemoPreviewTier> {
  const jar = await cookies();
  return parseDemoPreviewTier(jar.get(DEMO_TIER_COOKIE)?.value);
}

export function isDemoPreviewPro(tier: DemoPreviewTier): boolean {
  return tier === "pro";
}
