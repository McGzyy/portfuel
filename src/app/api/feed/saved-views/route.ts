import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import {
  createUserFeedSavedView,
  deleteUserFeedSavedView,
  importLocalFeedPresets,
  listUserFeedSavedViews,
} from "@/lib/feed/saved-filters-server";
import type { SavedFeedPreset } from "@/lib/feed/saved-filters";

export const dynamic = "force-dynamic";

const feedFilterSchema = z.enum(["all", "fueled", "equity", "crypto", "following"]);
const feedTabSchema = z.enum(["latest", "performing", "progress"]);

const createSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  filter: feedFilterSchema,
  tab: feedTabSchema,
  q: z.string().trim().max(120).optional(),
  newSince: z.boolean().optional(),
});

const migratePresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  filter: feedFilterSchema,
  tab: feedTabSchema,
  q: z.string().trim().max(120).optional(),
  newSince: z.boolean().optional(),
  savedAt: z.number().optional(),
});

const migrateSchema = z.object({
  presets: z.array(migratePresetSchema).max(6),
});

export async function GET() {
  try {
    const session = await requireActiveMember();
    const presets = await listUserFeedSavedViews(session.userId);
    return NextResponse.json({ presets });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "service_unavailable") {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
    }
    console.error("[feed/saved-views GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const raw = await request.json();

    if (raw && typeof raw === "object" && "presets" in raw) {
      const body = migrateSchema.parse(raw);
      const presets = await importLocalFeedPresets(
        session.userId,
        body.presets as SavedFeedPreset[]
      );
      return NextResponse.json({ presets, migrated: true });
    }

    const body = createSchema.parse(raw);
    const result = await createUserFeedSavedView(session.userId, {
      name: body.name,
      filter: body.filter as FeedFilter,
      tab: body.tab as FeedTab,
      q: body.q,
      newSince: body.newSince,
    });

    if (result.error === "limit_reached") {
      return NextResponse.json({ error: "limit_reached" }, { status: 409 });
    }
    if (result.error === "duplicate") {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }

    const presets = await listUserFeedSavedViews(session.userId);
    return NextResponse.json({ preset: result.preset, presets });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "service_unavailable") {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
    }
    console.error("[feed/saved-views POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireActiveMember();
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const removed = await deleteUserFeedSavedView(session.userId, id);
    if (!removed) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const presets = await listUserFeedSavedViews(session.userId);
    return NextResponse.json({ ok: true, presets });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "service_unavailable") {
      return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
    }
    console.error("[feed/saved-views DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
