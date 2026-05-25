import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import { fetchEmailPrefs } from "@/lib/email/preferences";
import { isEmailConfigured } from "@/lib/email/config";

const patchSchema = z.object({
  notifyEmail: z.union([z.string().email().max(254), z.literal("")]).optional(),
  emailInstantEnabled: z.boolean().optional(),
  emailDigestEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const prefs = await fetchEmailPrefs(session.userId);
    if (!prefs) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      ...prefs,
      emailConfigured: isEmailConfigured(),
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

    const update: Record<string, unknown> = {};
    if (body.notifyEmail !== undefined) {
      update.notify_email = body.notifyEmail.trim() || null;
    }
    if (body.emailInstantEnabled !== undefined) {
      update.email_instant_enabled = body.emailInstantEnabled;
    }
    if (body.emailDigestEnabled !== undefined) {
      update.email_digest_enabled = body.emailDigestEnabled;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const { error } = await db
      .from("users")
      .update(update as never)
      .eq("id", session.userId);

    if (error) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    const prefs = await fetchEmailPrefs(session.userId);
    return NextResponse.json({
      ...prefs,
      emailConfigured: isEmailConfigured(),
    });
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
