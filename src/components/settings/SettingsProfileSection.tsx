"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const BIO_MAX = 280;

export function SettingsProfileSection({
  initialUsername,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: {
  initialUsername: string;
  initialDisplayName: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        displayName?: string;
        bio?: string | null;
      };
      if (!res.ok) {
        setError(json.error === "invalid_input" ? "Check display name and bio length." : "Could not save profile.");
        return;
      }
      setDisplayName(json.displayName ?? displayName.trim());
      setBio(json.bio ?? "");
      setMessage("Profile saved.");
      router.refresh();
    } catch {
      setError("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarBusy(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/auth/profile/avatar", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        avatarUrl?: string;
      };
      if (!res.ok) {
        setError(json.message ?? "Could not upload photo.");
        return;
      }
      setAvatarUrl(json.avatarUrl ?? null);
      setMessage("Photo updated.");
      router.refresh();
    } catch {
      setError("Could not upload photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove photo.");
        return;
      }
      setAvatarUrl(null);
      setMessage("Photo removed.");
      router.refresh();
    } catch {
      setError("Could not remove photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <section aria-label="Profile" className="space-y-4">
      <div className="pf-workspace-panel p-5 sm:p-6">
        <h2 className="text-base font-bold text-[var(--foreground)]">Public profile</h2>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Shown on your member page, call cards, and rankings.{" "}
          <Link href={`/member/${initialUsername}`} className="font-semibold text-[var(--pf-red)] hover:underline">
            Preview →
          </Link>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="relative">
            <MemberAvatar
              displayName={displayName || initialDisplayName}
              username={initialUsername}
              avatarUrl={avatarUrl}
              size="lg"
              className="!h-16 !w-16 !text-sm"
            />
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pf-border)] bg-white text-[var(--pf-gray-700)] shadow-sm hover:bg-[var(--pf-gray-50)] disabled:opacity-60"
              aria-label="Upload profile photo"
            >
              {avatarBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatarBusy}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={avatarBusy}
                onClick={() => void removeAvatar()}
                className="text-[var(--pf-gray-600)]"
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="profile-display-name" className="text-xs font-semibold text-[var(--pf-gray-700)]">
              Display name
            </label>
            <Input
              id="profile-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="mt-1.5 max-w-md"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="profile-username" className="text-xs font-semibold text-[var(--pf-gray-700)]">
              Username
            </label>
            <Input
              id="profile-username"
              value={`@${initialUsername}`}
              readOnly
              disabled
              className="mt-1.5 max-w-md font-mono opacity-80"
            />
            <p className="mt-1 text-[11px] text-[var(--pf-gray-500)]">
              Login handle and profile URL — fixed at signup for now.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="profile-bio" className="text-xs font-semibold text-[var(--pf-gray-700)]">
                Bio
              </label>
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  bio.length > BIO_MAX ? "text-rose-600" : "text-[var(--pf-gray-400)]"
                )}
              >
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              rows={4}
              maxLength={BIO_MAX}
              placeholder="What you trade, your style, or what members should know…"
              className="mt-1.5 w-full max-w-xl resize-y rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm text-[var(--pf-gray-800)] shadow-[var(--pf-shadow-sm)] placeholder:text-[var(--pf-gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-red-ring)]"
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-emerald-600">{message}</p> : null}

        <div className="mt-5">
          <Button type="button" disabled={saving || displayName.trim().length < 2} onClick={() => void saveProfile()}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </section>
  );
}
