import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeWeeklyDigestPost, fetchWeeklyDigestRows } from "@/lib/social/weekly-digest";
import { postWeeklyDigest } from "@/lib/social/x-weekly-digest-post";
import { xConfigSummary } from "@/lib/social/x-config";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await fetchWeeklyDigestRows(3);
    const composed = await composeWeeklyDigestPost(rows);
    return NextResponse.json({
      rows,
      text: composed.ok ? composed.text : null,
      charCount: composed.ok ? composed.text.length : 0,
      refId: composed.ok ? composed.refId : null,
      chartUrl: "/api/admin/social/weekly-digest/chart",
      x: xConfigSummary(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/weekly-digest GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const postSchema = z.object({
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = postSchema.parse(await request.json());
    const result = await postWeeklyDigest({
      dryRun: body.dryRun,
      force: body.force,
    });
    if (!result.ok) {
      const status =
        result.error === "already_posted" ? 409 : result.error === "no_content" ? 404 : 502;
      return NextResponse.json({ error: result.error, text: result.text }, { status });
    }
    return NextResponse.json({
      ok: true,
      dryRun: result.dryRun,
      text: result.text,
      tweetId: result.tweetId,
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
    console.error("[admin/social/weekly-digest POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
