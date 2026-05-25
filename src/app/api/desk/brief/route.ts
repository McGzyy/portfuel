import { NextResponse } from "next/server";
import { fetchDeskBrief } from "@/lib/desk/brief";

export async function GET() {
  try {
    const brief = await fetchDeskBrief();
    return NextResponse.json(brief);
  } catch (e) {
    console.error("[desk/brief GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
