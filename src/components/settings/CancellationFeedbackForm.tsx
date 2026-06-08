"use client";

import { useState } from "react";
import {
  CANCELLATION_FEEDBACK_REASONS,
  type CancellationFeedbackReason,
  type CancellationFeedbackSource,
} from "@/lib/billing/cancellation-feedback-types";
import { cn } from "@/lib/utils";

export function CancellationFeedbackForm({
  onSubmitted,
  onSkip,
  source,
  submitLabel = "Submit feedback",
  skipLabel = "Skip for now",
  showSkip = true,
  className,
}: {
  onSubmitted?: () => void;
  onSkip?: () => void;
  source: CancellationFeedbackSource;
  submitLabel?: string;
  skipLabel?: string;
  showSkip?: boolean;
  className?: string;
}) {
  const [reason, setReason] = useState<CancellationFeedbackReason | "">("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!reason) {
      setError("Pick a reason so we know how to improve.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/billing/cancellation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          comment: comment.trim() || undefined,
          source,
        }),
      });
      if (!res.ok) {
        setError("Could not save feedback. Try again.");
        return;
      }
      onSubmitted?.();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Before you go — what led to this? Your answer helps us improve PortFuel for active traders.
      </p>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[var(--pf-black)]">Main reason</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CANCELLATION_FEEDBACK_REASONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                reason === opt.value
                  ? "border-[var(--pf-black)] bg-[var(--pf-gray-50)] font-medium text-[var(--pf-black)]"
                  : "border-[var(--pf-border)] text-[var(--pf-gray-600)] hover:border-[var(--pf-gray-300)]"
              )}
            >
              <input
                type="radio"
                name="cancel-reason"
                value={opt.value}
                checked={reason === opt.value}
                onChange={() => setReason(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-semibold text-[var(--pf-black)]">
        Anything else? (optional)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="What would have kept you subscribed?"
          className="mt-1.5 w-full resize-y rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2 text-sm font-normal text-[var(--pf-black)]"
        />
      </label>

      {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}

      <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="w-full rounded-lg bg-[var(--pf-navy)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:py-2"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {showSkip ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={saving}
            className="w-full py-2 text-sm font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)] sm:w-auto sm:py-0"
          >
            {skipLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
