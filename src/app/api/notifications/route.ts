import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
} from "@/lib/notifications/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    fetchNotifications(session.userId),
    fetchUnreadCount(session.userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

const readSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = readSchema.parse(await request.json());
    if (isDemoMode()) {
      return NextResponse.json({ ok: true, unreadCount: 0 });
    }
    await markNotificationsRead(session.userId, {
      ids: body.ids,
      all: body.all,
    });
    const unreadCount = await fetchUnreadCount(session.userId);
    return NextResponse.json({ ok: true, unreadCount });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[notifications POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
