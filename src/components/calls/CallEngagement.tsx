"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, timeAgo } from "@/lib/utils";
import type { CallComment } from "@/lib/calls/comments";

export function CallEngagement({
  callId,
  initialVoteScore = 0,
  initialCommentCount = 0,
  interactive = false,
  compact = false,
}: {
  callId: string;
  initialVoteScore?: number;
  initialCommentCount?: number;
  interactive?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [voteScore, setVoteScore] = useState(initialVoteScore);
  const [userVote, setUserVote] = useState<-1 | 1 | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CallComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingVote, setLoadingVote] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interactive) return;
    fetch(`/api/calls/${callId}/vote`)
      .then((r) => r.json())
      .then((d) => {
        if (d.userVote != null) setUserVote(d.userVote);
        if (typeof d.voteScore === "number") setVoteScore(d.voteScore);
      })
      .catch(() => {});
  }, [callId, interactive]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    setError("");
    try {
      const res = await fetch(`/api/calls/${callId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setComments(data.comments ?? []);
      if (typeof data.commentCount === "number") setCommentCount(data.commentCount);
    } catch {
      setError("Could not load comments.");
    } finally {
      setLoadingComments(false);
    }
  }, [callId]);

  useEffect(() => {
    if (expanded) loadComments();
  }, [expanded, loadComments]);

  async function castVote(value: 1 | -1) {
    if (!interactive) return;
    setLoadingVote(true);
    setError("");
    try {
      const res = await fetch(`/api/calls/${callId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "unauthorized") {
          window.location.href = "/login";
          return;
        }
        throw new Error();
      }
      setVoteScore(data.voteScore);
      setUserVote(data.userVote);
      router.refresh();
    } catch {
      setError("Could not save vote.");
    } finally {
      setLoadingVote(false);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/calls/${callId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setComments((prev) => [...prev, data.comment]);
      setCommentCount(data.commentCount);
      setDraft("");
      router.refresh();
    } catch {
      setError("Could not post comment.");
    } finally {
      setPosting(false);
    }
  }

  const voteLabel =
    voteScore > 0 ? `+${voteScore}` : voteScore < 0 ? String(voteScore) : "0";

  return (
    <div className={cn("border-t border-[var(--pf-border)]", compact ? "mt-3 pt-3" : "mt-4 pt-3")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {interactive ? (
            <>
              <button
                type="button"
                disabled={loadingVote}
                onClick={() => castVote(1)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors",
                  userVote === 1
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
                )}
                aria-label="Upvote"
              >
                <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <span className="min-w-[2ch] text-center text-xs font-bold tabular-nums text-[var(--pf-gray-700)]">
                {voteLabel}
              </span>
              <button
                type="button"
                disabled={loadingVote}
                onClick={() => castVote(-1)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors",
                  userVote === -1
                    ? "bg-rose-100 text-rose-800"
                    : "text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
                )}
                aria-label="Downvote"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--pf-gray-400)]">
              {voteScore !== 0 ? `${voteLabel} score` : "No votes yet"}
            </span>
          )}

          <button
            type="button"
            onClick={() => interactive && setExpanded((v) => !v)}
            className={cn(
              "ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors",
              interactive
                ? "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)]"
                : "cursor-default text-[var(--pf-gray-400)]"
            )}
            disabled={!interactive}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </button>
        </div>

        {loadingVote ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--pf-gray-400)]" /> : null}
      </div>

      {expanded && interactive ? (
        <div className="mt-4 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-[var(--pf-gray-400)]">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[var(--pf-gray-400)]">No comments yet. Start the thread.</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg bg-[var(--pf-gray-50)] px-3 py-2 text-sm"
                >
                  <p className="text-xs font-semibold text-[var(--pf-gray-600)]">
                    {c.display_name ?? `Trader ${c.pin}`}{" "}
                    <span className="font-normal text-[var(--pf-gray-400)]">
                      · {timeAgo(c.created_at)}
                    </span>
                  </p>
                  <p className="mt-1 leading-relaxed text-[var(--pf-gray-700)]">{c.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={postComment} className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              placeholder="Add a comment…"
              className="min-h-[72px] text-sm"
              required
            />
            <Button type="submit" size="sm" disabled={posting || draft.trim().length < 1}>
              {posting ? "Posting…" : "Post comment"}
            </Button>
          </form>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-[var(--pf-red)]">{error}</p> : null}
    </div>
  );
}
