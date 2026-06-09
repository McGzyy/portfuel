import { createServiceClient, hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export const SUPPORT_ATTACHMENT_BUCKET = "support-attachments";
export const SUPPORT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const SUPPORT_ATTACHMENT_MAX_PER_MESSAGE = 3;

export const SUPPORT_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export type SupportAttachmentRow = {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  byte_size: number;
  created_at: string;
};

export type SupportAttachmentView = {
  id: string;
  ticketId: string;
  messageId: string | null;
  fileName: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
};

export function isSupportAttachmentsEnabled(): boolean {
  return hasSupabaseConfig() && !isDemoMode();
}

export function validateSupportAttachmentFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (file.size <= 0) return "Empty file.";
  if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) return "File must be 5 MB or smaller.";
  if (!SUPPORT_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof SUPPORT_ATTACHMENT_MIME_TYPES)[number])) {
    return "Use JPG, PNG, WebP, GIF, or PDF.";
  }
  const name = file.name.trim();
  if (!name || name.length > 255) return "Invalid file name.";
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-()+\s]/g, "_").slice(0, 200);
}

function toView(row: SupportAttachmentRow): SupportAttachmentView {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    messageId: row.message_id,
    fileName: row.file_name,
    contentType: row.content_type,
    byteSize: row.byte_size,
    createdAt: row.created_at,
  };
}

export async function listTicketAttachments(
  ticketId: string
): Promise<SupportAttachmentView[]> {
  if (!isSupportAttachmentsEnabled()) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("support_ticket_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as SupportAttachmentRow[]).map(toView);
}

export async function countMessageAttachments(messageId: string): Promise<number> {
  if (!isSupportAttachmentsEnabled()) return 0;

  const db = createServiceClient();
  const { count, error } = await db
    .from("support_ticket_attachments")
    .select("id", { count: "exact", head: true })
    .eq("message_id", messageId);

  if (error) throw error;
  return count ?? 0;
}

async function assertTicketAccess(opts: {
  ticketId: string;
  userId: string;
  role: "member" | "admin";
}): Promise<void> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("support_tickets")
    .select("user_id, status")
    .eq("id", opts.ticketId)
    .maybeSingle();

  if (error || !data) throw new Error("ticket_not_found");
  const row = data as { user_id: string; status: string };
  if (opts.role === "member" && row.user_id !== opts.userId) {
    throw new Error("forbidden");
  }
  if (row.status === "closed") throw new Error("ticket_closed");
}

export async function uploadSupportAttachment(opts: {
  ticketId: string;
  messageId?: string | null;
  userId: string;
  role: "member" | "admin";
  fileName: string;
  contentType: string;
  byteSize: number;
  data: Buffer;
}): Promise<SupportAttachmentView> {
  if (!isSupportAttachmentsEnabled()) {
    throw new Error("attachments_unavailable");
  }

  const validation = validateSupportAttachmentFile({
    name: opts.fileName,
    type: opts.contentType,
    size: opts.byteSize,
  });
  if (validation) throw new Error("invalid_file");

  await assertTicketAccess({
    ticketId: opts.ticketId,
    userId: opts.userId,
    role: opts.role,
  });

  if (opts.messageId) {
    const db = createServiceClient();
    const { data: message } = await db
      .from("support_ticket_messages")
      .select("id")
      .eq("id", opts.messageId)
      .eq("ticket_id", opts.ticketId)
      .maybeSingle();
    if (!message) throw new Error("message_not_found");

    const count = await countMessageAttachments(opts.messageId);
    if (count >= SUPPORT_ATTACHMENT_MAX_PER_MESSAGE) {
      throw new Error("attachment_limit");
    }
  }

  const attachmentId = crypto.randomUUID();
  const safeName = sanitizeFileName(opts.fileName);
  const storagePath = `${opts.ticketId}/${attachmentId}-${safeName}`;

  const db = createServiceClient();
  const { error: uploadError } = await db.storage
    .from(SUPPORT_ATTACHMENT_BUCKET)
    .upload(storagePath, opts.data, {
      contentType: opts.contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[support/attachment-upload]", uploadError);
    throw new Error("upload_failed");
  }

  const { data: row, error: insertError } = await db
    .from("support_ticket_attachments")
    .insert({
      id: attachmentId,
      ticket_id: opts.ticketId,
      message_id: opts.messageId ?? null,
      uploaded_by: opts.userId,
      storage_path: storagePath,
      file_name: safeName,
      content_type: opts.contentType,
      byte_size: opts.byteSize,
    } as never)
    .select("*")
    .single();

  if (insertError || !row) {
    await db.storage.from(SUPPORT_ATTACHMENT_BUCKET).remove([storagePath]);
    console.error("[support/attachment-insert]", insertError);
    throw new Error("insert_failed");
  }

  return toView(row as SupportAttachmentRow);
}

export async function getSupportAttachmentForDownload(opts: {
  attachmentId: string;
  userId: string;
  role: "member" | "admin";
}): Promise<{ signedUrl: string; fileName: string; contentType: string } | null> {
  if (!isSupportAttachmentsEnabled()) return null;

  const db = createServiceClient();
  const { data: attachment, error } = await db
    .from("support_ticket_attachments")
    .select("*")
    .eq("id", opts.attachmentId)
    .maybeSingle();

  if (error || !attachment) return null;
  const row = attachment as SupportAttachmentRow;

  const { data: ticket, error: ticketError } = await db
    .from("support_tickets")
    .select("user_id")
    .eq("id", row.ticket_id)
    .maybeSingle();

  if (ticketError || !ticket) return null;
  if (opts.role === "member" && (ticket as { user_id: string }).user_id !== opts.userId) {
    return null;
  }

  const { data: signed, error: signError } = await db.storage
    .from(SUPPORT_ATTACHMENT_BUCKET)
    .createSignedUrl(row.storage_path, 60 * 10);

  if (signError || !signed?.signedUrl) {
    console.error("[support/attachment-sign]", signError);
    return null;
  }

  return {
    signedUrl: signed.signedUrl,
    fileName: row.file_name,
    contentType: row.content_type,
  };
}
