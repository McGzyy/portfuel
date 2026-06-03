import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  COPY_PLACEHOLDER_HELP,
  DEFAULT_SOCIAL_POST_COPY,
  composeMilestonePostText,
  fetchAllSocialPostCopy,
  fetchSocialPostCopy,
  updateSocialPostCopy,
  type SocialPostCopyVariantId,
} from "@/lib/social/copy-templates";
import { demoMilestoneTweetParts } from "@/lib/charts/social-chart-demo";

export async function GET() {
  try {
    await requireAdmin();
    const copies = await fetchAllSocialPostCopy();
    const copy = copies.default;
    const demo = await demoMilestoneTweetParts("return_25");
    return NextResponse.json({
      copy,
      copies,
      defaults: DEFAULT_SOCIAL_POST_COPY,
      placeholders: COPY_PLACEHOLDER_HELP,
      demoPreview: composeMilestonePostText(copy, demo),
      abHelp: {
        enabled: process.env.X_COPY_AB_ENABLED === "true",
        percent: process.env.X_COPY_AB_PERCENT ?? "50",
        forcedVariant: process.env.X_POST_COPY_VARIANT ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/copy GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  variantId: z.enum(["default", "variant_b"]).optional(),
  milestoneLeadTemplate: z.string().min(4).max(400).optional(),
  milestoneTailTemplate: z.string().min(4).max(400).optional(),
  fueledTemplate: z.string().min(4).max(500).optional(),
  leaderboardTemplate: z.string().min(4).max(500).optional(),
  memberWinTemplate: z.string().min(4).max(500).optional(),
  memberWinUpdateTemplate: z.string().min(4).max(500).optional(),
  weeklyDigestTemplate: z.string().min(4).max(600).optional(),
  disclaimer: z.string().min(4).max(120).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await request.json());
    const variantId: SocialPostCopyVariantId = body.variantId ?? "default";
    const { variantId: _v, ...fields } = body;
    const result = await updateSocialPostCopy(variantId, fields);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const demo = await demoMilestoneTweetParts("return_25");
    const defaultCopy = await fetchSocialPostCopy("default");
    return NextResponse.json({
      ok: true,
      copy: variantId === "default" ? result.copy : defaultCopy,
      savedCopy: result.copy,
      variantId,
      demoPreview: composeMilestonePostText(defaultCopy, demo),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/copy PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
