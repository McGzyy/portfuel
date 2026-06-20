import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";
import { snoozeUntilFromDuration } from "@/lib/notifications/inbox-filters";
import {
  fetchUnreadCount,
  snoozeNotification,
} from "@/lib/notifications/service";

const bodySchema = z.object({
  id: z.string().uuid(),
  duration: z.enum(["1h", "tomorrow", "1w"]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    if (isDemoMode()) {
      return NextResponse.json({ ok: true, unreadCount: 0 });
    }

    const until = snoozeUntilFromDuration(body.duration);
    const result = await snoozeNotification(session.userId, body.id, until);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.migrationRequired ? "migration_required" : "snooze_failed",
        },
        { status: result.migrationRequired ? 503 : 500 }
      );
    }

    const unreadCount = await fetchUnreadCount(session.userId);
    return NextResponse.json({ ok: true, unreadCount, snoozedUntil: until });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[notifications/snooze POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
