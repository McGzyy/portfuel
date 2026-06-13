import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import { requireSession } from "@/lib/auth/session";

const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());

    const passError = validatePassword(body.newPassword);
    if (passError) {
      return NextResponse.json({ error: "invalid_password", message: passError }, { status: 400 });
    }

    if (body.currentPassword === body.newPassword) {
      return NextResponse.json(
        { error: "same_password", message: "New password must be different." },
        { status: 400 }
      );
    }

    const db = createServiceClient();
    const { data: row, error: loadError } = await db
      .from("users")
      .select("password_hash")
      .eq("id", session.userId)
      .maybeSingle();

    if (loadError || !row?.password_hash) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    const matches = await verifyPassword(body.currentPassword, row.password_hash);
    if (!matches) {
      return NextResponse.json(
        { error: "invalid_current_password", message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(body.newPassword);
    const { error: updateError } = await db
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", session.userId);

    if (updateError) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/change-password]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
