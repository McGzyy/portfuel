"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import {
  SUPPORT_ATTACHMENT_MAX_PER_MESSAGE,
  SUPPORT_ATTACHMENT_MIME_TYPES,
  type SupportAttachmentView,
} from "@/lib/support/attachments";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SupportAttachmentPicker({
  files,
  onChange,
  disabled = false,
  className,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = SUPPORT_ATTACHMENT_MIME_TYPES.join(",");

  function addFiles(incoming: FileList | null) {
    if (!incoming?.length) return;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= SUPPORT_ATTACHMENT_MAX_PER_MESSAGE) break;
      next.push(file);
    }
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || files.length >= SUPPORT_ATTACHMENT_MAX_PER_MESSAGE}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] transition-colors hover:bg-[var(--pf-gray-50)] disabled:opacity-50"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attach screenshot
        </button>
        <span className="text-[11px] text-[var(--pf-gray-500)]">
          JPG, PNG, WebP, GIF, or PDF · up to 5 MB · max {SUPPORT_ATTACHMENT_MAX_PER_MESSAGE}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2"
            >
              <span className="min-w-0 truncate text-xs font-medium text-[var(--pf-gray-700)]">
                {file.name}
                <span className="ml-1.5 font-normal text-[var(--pf-gray-500)]">
                  ({formatBytes(file.size)})
                </span>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAt(index)}
                className="shrink-0 rounded p-1 text-[var(--pf-gray-400)] hover:bg-white hover:text-[var(--pf-gray-700)]"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SupportAttachmentLinks({
  attachments,
  messageId,
}: {
  attachments: SupportAttachmentView[];
  messageId: string;
}) {
  const rows = attachments.filter((a) => a.messageId === messageId);
  if (!rows.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {rows.map((a) => (
        <li key={a.id}>
          <a
            href={`/api/support/attachments/${a.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-[var(--pf-border)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
          >
            <Paperclip className="h-3 w-3" />
            {a.fileName}
          </a>
        </li>
      ))}
    </ul>
  );
}

export async function uploadTicketAttachments(opts: {
  ticketId: string;
  messageId?: string;
  files: File[];
}): Promise<void> {
  for (const file of opts.files) {
    const form = new FormData();
    form.append("file", file);
    if (opts.messageId) form.append("messageId", opts.messageId);

    const res = await fetch(
      `/api/support/tickets/${encodeURIComponent(opts.ticketId)}/attachments`,
      { method: "POST", body: form }
    );
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (json.error === "attachment_limit") {
        throw new Error("Too many attachments on this message.");
      }
      if (json.error === "invalid_file") {
        throw new Error(`${file.name}: use JPG, PNG, WebP, GIF, or PDF under 5 MB.`);
      }
      throw new Error(`Could not upload ${file.name}.`);
    }
  }
}
