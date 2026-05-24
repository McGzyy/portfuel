import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";

const schema = z.object({
  displayName: z.string().min(2).max(32),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    const db = createServiceClient();

    const { error } = await db
      .from("users")
      .update({ display_name: body.displayName.trim() } as never)
      .eq("id", session.userId);

    if (error) {
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
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
