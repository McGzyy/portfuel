import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { searchWorkspace } from "@/lib/search/workspace-search";

function parseRecentSymbols(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    ),
  ].slice(0, 8);
}

export async function GET(request: Request) {
  try {
    const session = await requireActiveMember();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const recentSymbols = parseRecentSymbols(url.searchParams.get("recent"));
    const results = await searchWorkspace(session.userId, q, { recentSymbols });
    return NextResponse.json(results);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[search GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
