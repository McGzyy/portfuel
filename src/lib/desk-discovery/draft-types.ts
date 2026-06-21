import { z } from "zod";

export const discoveryDraftSchema = z.object({
  direction: z.enum(["long", "short"]),
  thesis: z.string().min(20).max(2000),
  catalyst: z.string().max(500),
  risk: z.string().max(500),
  timeframe: z.string().max(120),
  entryNote: z.string().max(200).optional(),
  targetNote: z.string().max(200).optional(),
  stopNote: z.string().max(200).optional(),
  /** How the draft was produced — shown in admin UI. */
  source: z.enum(["ai", "template"]).optional(),
});

export type DiscoveryDraftPayload = z.infer<typeof discoveryDraftSchema>;

export function formatDiscoveryDraftForPublish(d: DiscoveryDraftPayload): string {
  const blocks = [d.thesis.trim()];
  if (d.catalyst.trim()) blocks.push(`Catalyst: ${d.catalyst.trim()}`);
  if (d.risk.trim()) blocks.push(`Risk: ${d.risk.trim()}`);
  return blocks.filter(Boolean).join("\n\n");
}

export function parseLevelNote(note: string | undefined): number | null {
  if (!note?.trim()) return null;
  const match = note.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0]!);
  return Number.isFinite(n) && n > 0 ? n : null;
}
