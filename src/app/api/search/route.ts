import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { searchWorkspace } from "@/lib/search/workspace-search";

export async function GET(request: Request) {
  try {
    const session = await requireActiveMember();
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const results = await searchWorkspace(session.userId, q);
    return NextResponse.json(results);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[search GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
