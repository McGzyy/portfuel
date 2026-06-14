import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/supabase";
import {
  authUserIdFromSession,
  fetchAdminPublishIdentities,
  isAllowedPublishIdentity,
} from "@/lib/admin/publish-identity";
import { signSessionToken, sessionCookieOptions } from "@/lib/auth/session-sync";
import { fetchLifecycleSessionFields } from "@/lib/auth/session-lifecycle";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { parseIconTheme, parseThemeMode } from "@/lib/appearance/types";
import { cookies } from "next/headers";

const COOKIE_NAME = "portfuel_session";

const postSchema = z.object({
  userId: z.string().uuid(),
});

export async function GET() {
  try {
    const session = await requireAdmin();
    const authUserId = authUserIdFromSession(session);
    const identities = await fetchAdminPublishIdentities(authUserId);
    return NextResponse.json({
      activeUserId: session.userId,
      authUserId,
      identities,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/switch-identity GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const authUserId = authUserIdFromSession(session);
    const body = postSchema.parse(await request.json());

    const allowed = await isAllowedPublishIdentity(authUserId, body.userId);
    if (!allowed) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const db = createServiceClient();
    const { data: target, error } = await db
      .from("users")
      .select(
        "id, username, display_name, subscription_status, membership_tier, pro_granted_until, theme_mode, icon_theme"
      )
      .eq("id", body.userId)
      .maybeSingle();

    if (error || !target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const row = target as {
      id: string;
      username: string;
      display_name: string | null;
      subscription_status: typeof session.subscriptionStatus;
      membership_tier: typeof session.membershipTier;
      pro_granted_until: string | null;
      theme_mode: string | null;
      icon_theme: string | null;
    };

    const lifecycle = await fetchLifecycleSessionFields(row.id);
    const nextSession = {
      ...session,
      authUserId,
      userId: row.id,
      username: row.username,
      displayName: row.display_name,
      subscriptionStatus: row.subscription_status,
      membershipTier: effectiveMembershipTier(row.membership_tier, row.pro_granted_until),
      proGrantedUntil: row.pro_granted_until,
      ...lifecycle,
      canAccessWorkspace: true,
      themeMode: parseThemeMode(row.theme_mode),
      iconTheme: parseIconTheme(row.icon_theme),
    };

    const token = await signSessionToken(nextSession);
    const jar = await cookies();
    jar.set(COOKIE_NAME, token, sessionCookieOptions());

    const identities = await fetchAdminPublishIdentities(authUserId);
    return NextResponse.json({
      ok: true,
      activeUserId: row.id,
      username: row.username,
      identities,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/switch-identity POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
