import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import { signSessionToken, sessionCookieOptions } from "@/lib/auth/session-sync";
import { fetchAppearancePrefs } from "@/lib/appearance/prefs";
import { APPEARANCE_COOKIE, serializeAppearanceCookie } from "@/lib/appearance/cookie";
import {
  parseIconTheme,
  parseThemeMode,
  resolveIconVariant,
} from "@/lib/appearance/types";

const patchSchema = z.object({
  themeMode: z.enum(["light", "dark"]).optional(),
  iconTheme: z.enum(["auto", "dark", "red", "light"]).optional(),
});

const COOKIE_NAME = "portfuel_session";

export async function GET() {
  try {
    const session = await requireSession();
    const prefs = await fetchAppearancePrefs(session.userId);
    return NextResponse.json({
      ...prefs,
      resolvedIconVariant: resolveIconVariant(prefs),
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
    if (body.themeMode !== undefined) {
      update.theme_mode = parseThemeMode(body.themeMode);
    }
    if (body.iconTheme !== undefined) {
      update.icon_theme = parseIconTheme(body.iconTheme);
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

    const prefs = await fetchAppearancePrefs(session.userId);
    const nextSession = {
      ...session,
      themeMode: prefs.themeMode,
      iconTheme: prefs.iconTheme,
    };
    const token = await signSessionToken(nextSession);

    const res = NextResponse.json({
      ...prefs,
      resolvedIconVariant: resolveIconVariant(prefs),
    });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
    res.cookies.set(APPEARANCE_COOKIE, serializeAppearanceCookie(prefs), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
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
