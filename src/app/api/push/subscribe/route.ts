import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { isPushConfigured } from "@/lib/push/config";
import { upsertPushSubscription, deletePushSubscription } from "@/lib/push/subscriptions";

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

export async function POST(request: Request) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json({ error: "push_not_configured" }, { status: 503 });
    }

    const session = await requireActiveMember();
    const body = subscribeSchema.parse(await request.json());
    const userAgent = request.headers.get("user-agent");

    const result = await upsertPushSubscription(session.userId, body.subscription, userAgent);
    if ("error" in result) {
      const status = result.error === "demo_readonly" ? 403 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[push/subscribe POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireActiveMember();
    const endpoint = new URL(request.url).searchParams.get("endpoint") ?? "";
    if (!endpoint) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    await deletePushSubscription(session.userId, endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[push/subscribe DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
