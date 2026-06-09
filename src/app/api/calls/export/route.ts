import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { buildCallsExportCsv, callsExportFilename } from "@/lib/calls/export-csv";
import { fetchUserCallsForExport } from "@/lib/users/profile";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const calls = await fetchUserCallsForExport(session.userId);
    const csv = buildCallsExportCsv(calls, session.username);
    const filename = callsExportFilename(session.username);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[calls/export]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
