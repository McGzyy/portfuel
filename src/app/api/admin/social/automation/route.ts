import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  DEFAULT_X_AUTOMATION_PREFS,
  fetchXAutomationPrefsFromDb,
  getEffectiveXAutomation,
  updateXAutomationPrefs,
} from "@/lib/social/x-automation-prefs";
import { xConfigSummary } from "@/lib/social/x-config";

export async function GET() {
  try {
    await requireAdmin();
    const [envConfig, effective, stored] = await Promise.all([
      Promise.resolve(xConfigSummary()),
      getEffectiveXAutomation(),
      fetchXAutomationPrefsFromDb(),
    ]);

    return NextResponse.json({
      env: envConfig,
      effective,
      stored,
      defaults: DEFAULT_X_AUTOMATION_PREFS,
      managedInAdmin: stored != null,
      safety: {
        dryRun: envConfig.dryRun,
        livePostingReady: envConfig.livePostingReady,
        note: envConfig.dryRun
          ? "Posts log only until X_API_DRY_RUN=false on Vercel."
          : envConfig.livePostingReady
            ? "Live X posting is enabled."
            : "Set X_API_ENABLED and X_API_BEARER_TOKEN to post.",
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/automation GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  autopostFueledOnPublish: z.boolean().optional(),
  autopostMilestones: z.boolean().optional(),
  cronFueledPosts: z.boolean().optional(),
  cronLeaderboardPosts: z.boolean().optional(),
  cronMemberWinPosts: z.boolean().optional(),
  cronWeeklyDigestPosts: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await request.json());
    const result = await updateXAutomationPrefs(body);
    if ("error" in result) {
      const status = result.error === "migration_required" ? 503 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    const envConfig = xConfigSummary();
    return NextResponse.json({
      ok: true,
      stored: result.prefs,
      effective: await getEffectiveXAutomation(),
      env: envConfig,
      safety: {
        dryRun: envConfig.dryRun,
        livePostingReady: envConfig.livePostingReady,
      },
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
    console.error("[admin/social/automation PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
