import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import {
  fetchFollowingMembers,
  followMember,
  unfollowMember,
} from "@/lib/follows/service";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const following = await fetchFollowingMembers(session.userId);
    return NextResponse.json({ following });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[follows GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const postSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const body = postSchema.parse(await request.json());
    const result = await followMember(session.userId, body.userId);
    if ("error" in result) {
      const status =
        result.error === "follow_limit"
          ? 409
          : result.error === "demo_readonly"
            ? 403
            : result.error === "member_not_found"
              ? 404
              : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    const following = await fetchFollowingMembers(session.userId);
    return NextResponse.json({ ok: true, following });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[follows POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireActiveMember();
    const userId = new URL(request.url).searchParams.get("userId") ?? "";
    const parsed = postSchema.safeParse({ userId });
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const result = await unfollowMember(session.userId, parsed.data.userId);
    if ("error" in result) {
      const status = result.error === "demo_readonly" ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    const following = await fetchFollowingMembers(session.userId);
    return NextResponse.json({ ok: true, following });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[follows DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
