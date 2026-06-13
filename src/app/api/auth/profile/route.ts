import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import { refreshSessionFromDatabase, sessionCookieOptions } from "@/lib/auth/session-sync";

const COOKIE_NAME = "portfuel_session";

const patchSchema = z
  .object({
    displayName: z.string().trim().min(2).max(32).optional(),
    bio: z.string().trim().max(280).nullable().optional(),
  })
  .refine((body) => body.displayName !== undefined || body.bio !== undefined, {
    message: "No fields to update",
  });

async function refreshSessionCookie(session: Awaited<ReturnType<typeof requireSession>>) {
  const { session: merged, token } = await refreshSessionFromDatabase(session, { force: true });
  if (token && merged) {
    const jar = await cookies();
    jar.set(COOKIE_NAME, token, sessionCookieOptions());
  }
  return merged ?? session;
}

export async function GET() {
  try {
    const session = await requireSession();
    const db = createServiceClient();
    const { data, error } = await db
      .from("users")
      .select("username, display_name, bio, avatar_url")
      .eq("id", session.userId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const row = data as {
      username: string;
      display_name: string | null;
      bio: string | null;
      avatar_url: string | null;
    };

    return NextResponse.json({
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
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

    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (body.displayName !== undefined) {
      updates.display_name = body.displayName;
    }
    if (body.bio !== undefined) {
      updates.bio = body.bio?.trim() ? body.bio.trim() : null;
    }

    const { error } = await db.from("users").update(updates as never).eq("id", session.userId);

    if (error) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    const merged = await refreshSessionCookie(session);

    const { data: row } = await db
      .from("users")
      .select("username, display_name, bio, avatar_url")
      .eq("id", session.userId)
      .maybeSingle();

    const profile = row as {
      username: string;
      display_name: string | null;
      bio: string | null;
      avatar_url: string | null;
    } | null;

    return NextResponse.json({
      ok: true,
      displayName: profile?.display_name ?? merged.displayName,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      username: profile?.username ?? session.username,
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
