import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  deleteDeskPortfolioEntry,
  fetchDeskPortfolioForAdmin,
  upsertDeskPortfolioEntry,
} from "@/lib/desk/portfolio";

export async function GET() {
  try {
    await requireAdmin();
    const data = await fetchDeskPortfolioForAdmin();
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/desk-portfolio GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  assetClass: z.enum(["equity", "crypto"]),
  symbol: z.string().min(1).max(12),
  direction: z.enum(["long", "short"]),
  conviction: z.number().min(1).max(5),
  horizonTag: z.string().max(32).nullable().optional(),
  thesis: z.string().min(10).max(2000),
  entryPrice: z.number().nullable().optional(),
  targetPrice: z.number().nullable().optional(),
  stopPrice: z.number().nullable().optional(),
  status: z.enum(["open", "closed"]),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = upsertSchema.parse(await request.json());
    const result = await upsertDeskPortfolioEntry(body);
    if ("error" in result) {
      const status = result.error === "crypto_not_allowed" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    const data = await fetchDeskPortfolioForAdmin();
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/desk-portfolio POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    const result = await deleteDeskPortfolioEntry(parsed.data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const data = await fetchDeskPortfolioForAdmin();
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/desk-portfolio DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

