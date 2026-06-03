export type SocialPostCopyVariantId = "default" | "variant_b";

export const SOCIAL_COPY_VARIANT_IDS: SocialPostCopyVariantId[] = [
  "default",
  "variant_b",
];

export const SOCIAL_COPY_VARIANT_LABELS: Record<SocialPostCopyVariantId, string> = {
  default: "Default (A)",
  variant_b: "Variant B",
};

function hashBucket(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100;
}

/** Which template row to use for member spotlight / update posts. */
export function resolveMemberWinCopyVariant(refId: string): SocialPostCopyVariantId {
  const forced = process.env.X_POST_COPY_VARIANT?.trim();
  if (forced === "variant_b") return "variant_b";
  if (forced === "default") return "default";

  if (process.env.X_COPY_AB_ENABLED !== "true") return "default";

  const pct = Math.min(
    100,
    Math.max(0, Number(process.env.X_COPY_AB_PERCENT ?? 50) || 50)
  );
  return hashBucket(refId) < pct ? "variant_b" : "default";
}
