import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  COPY_PLACEHOLDER_HELP,
  DEFAULT_SOCIAL_POST_COPY,
  composeMilestonePostText,
  fetchSocialPostCopy,
  updateSocialPostCopy,
} from "@/lib/social/copy-templates";
import { demoMilestoneTweetParts } from "@/lib/charts/social-chart-demo";

export async function GET() {
  try {
    await requireAdmin();
    const copy = await fetchSocialPostCopy();
    const demo = await demoMilestoneTweetParts("return_25");
    return NextResponse.json({
      copy,
      defaults: DEFAULT_SOCIAL_POST_COPY,
      placeholders: COPY_PLACEHOLDER_HELP,
      demoPreview: composeMilestonePostText(copy, demo),
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
  milestoneLeadTemplate: z.string().min(4).max(400).optional(),
  milestoneTailTemplate: z.string().min(4).max(400).optional(),
  fueledTemplate: z.string().min(4).max(500).optional(),
  leaderboardTemplate: z.string().min(4).max(500).optional(),
  disclaimer: z.string().min(4).max(120).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await request.json());
    const result = await updateSocialPostCopy(body);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const demo = await demoMilestoneTweetParts("return_25");
    return NextResponse.json({
      ok: true,
      copy: result.copy,
      demoPreview: composeMilestonePostText(result.copy, demo),
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
