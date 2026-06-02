import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/auth/session";

type ListKind = "member" | "pro" | "both";

function parseList(raw: string | null): ListKind {
  if (raw === "member" || raw === "pro" || raw === "both") return raw;
  return "both";
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const list = parseList(new URL(request.url).searchParams.get("list"));

    const db = createServiceClient();
    let query = db
      .from("users")
      .select(
        "email, username, display_name, membership_tier, marketing_member_opt_in, marketing_pro_opt_in, email_verified_at"
      )
      .eq("role", "member")
      .not("email_verified_at", "is", null)
      .not("email", "is", null);

    if (list === "member") {
      query = query.eq("marketing_member_opt_in", true);
    } else if (list === "pro") {
      query = query.eq("marketing_pro_opt_in", true);
    } else {
      query = query.or("marketing_member_opt_in.eq.true,marketing_pro_opt_in.eq.true");
    }

    const { data, error } = await query.order("username", { ascending: true });

    if (error) {
      console.error("[admin/marketing-export]", error);
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }

    const rows = (data ?? []).filter((r) => Boolean((r.email as string)?.trim()));

    const header = [
      "email",
      "username",
      "display_name",
      "membership_tier",
      "marketing_member_opt_in",
      "marketing_pro_opt_in",
    ];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          csvEscape(String(r.email).trim().toLowerCase()),
          csvEscape(String(r.username)),
          csvEscape(String(r.display_name ?? "")),
          csvEscape(String(r.membership_tier ?? "")),
          r.marketing_member_opt_in ? "true" : "false",
          r.marketing_pro_opt_in ? "true" : "false",
        ].join(",")
      ),
    ];

    const filename =
      list === "both"
        ? "portfuel-marketing-opt-in.csv"
        : `portfuel-marketing-${list}.csv`;

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/marketing-export]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
