import { NextResponse } from "next/server";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";

export async function GET() {
  try {
    const entries = await fetchDeskPortfolio();
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("[desk/portfolio GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

