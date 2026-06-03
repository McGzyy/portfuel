import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import { describeMemberWinRules } from "@/lib/social/member-win-eligibility";

const patchSchema = z.object({
  allowSocialHighlight: z.boolean().optional(),
  showThesis: z.boolean().optional(),
  showUsername: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const db = createServiceClient();
    const { data, error } = await db
      .from("users")
      .select(
        "allow_social_highlight, social_highlight_show_thesis, social_highlight_show_username, social_highlight_consented_at"
      )
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const row = data as {
      allow_social_highlight: boolean;
      social_highlight_show_thesis: boolean;
      social_highlight_show_username: boolean;
      social_highlight_consented_at: string | null;
    };

    return NextResponse.json({
      allowSocialHighlight: row.allow_social_highlight,
      showThesis: row.social_highlight_show_thesis,
      showUsername: row.social_highlight_show_username,
      consentedAt: row.social_highlight_consented_at,
      rulesSummary: describeMemberWinRules(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = patchSchema.parse(await request.json());
    const db = createServiceClient();

    const updates: Record<string, unknown> = {};
    if (body.allowSocialHighlight !== undefined) {
      updates.allow_social_highlight = body.allowSocialHighlight;
      if (body.allowSocialHighlight) {
        updates.social_highlight_consented_at = new Date().toISOString();
      }
    }
    if (body.showThesis !== undefined) {
      updates.social_highlight_show_thesis = body.showThesis;
    }
    if (body.showUsername !== undefined) {
      updates.social_highlight_show_username = body.showUsername;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const { error } = await db
      .from("users")
      .update(updates as never)
      .eq("id", session.userId);

    if (error) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return GET();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
