"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthSessionListItem } from "@/lib/auth/auth-sessions";
import { SettingsChangePasswordForm } from "@/components/settings/SettingsChangePasswordForm";
import { cn } from "@/lib/utils";

type SessionsResponse = {
  sessions: AuthSessionListItem[];
  totpVerified: boolean;
};

export function SettingsSecuritySection() {
  const router = useRouter();
  const [data, setData] = useState<SessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | "all" | null>(null);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sessions");
      if (!res.ok) {
        setError("Could not load sessions.");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Could not load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function revokeSession(sessionId: string) {
    setBusyId(sessionId);
    setError("");
    try {
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError("Could not sign out that device.");
        return;
      }
      if (body.signedOut) {
        router.push("/login");
        router.refresh();
        return;
      }
      await loadSessions();
    } catch {
      setError("Could not sign out that device.");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeAll() {
    setBusyId("all");
    setError("");
    try {
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) {
        setError("Could not sign out everywhere.");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not sign out everywhere.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-label="Security" className="space-y-4">
      <SettingsChangePasswordForm />
      <div className="pf-workspace-panel p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-700)]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[var(--foreground)]">Two-factor authentication</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-600)]">
              {data?.totpVerified
                ? "Your account uses an authenticator app at sign-in."
                : "Add an authenticator app for an extra layer of protection."}
            </p>
            {!data?.totpVerified ? (
              <Link
                href="/security/2fa"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--pf-red)] hover:underline"
              >
                Set up 2FA
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="pf-workspace-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">Active sessions</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
              Devices signed in to your PortFuel account. Sign out any session you do not recognize.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || busyId !== null || !data?.sessions.length}
            onClick={() => void revokeAll()}
          >
            {busyId === "all" ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Signing out…
              </>
            ) : (
              "Sign out everywhere"
            )}
          </Button>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-4 divide-y divide-[var(--pf-border)] rounded-lg border border-[var(--pf-border)]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--pf-gray-400)]" />
            </div>
          ) : null}

          {!loading && data?.sessions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">
              No active sessions found. Sign in again to register this device.
            </p>
          ) : null}

          {!loading
            ? data?.sessions.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
                      <MonitorSmartphone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {row.clientLabel}
                        {row.isCurrent ? (
                          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            This device
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
                        Active {formatDistanceToNow(new Date(row.lastSeenAt), { addSuffix: true })}
                        {row.ipHint ? ` · ${row.ipHint}` : ""}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--pf-gray-400)]">
                        Signed in {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!row.isCurrent ? (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void revokeSession(row.id)}
                      className={cn(
                        "rounded-lg border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)] disabled:opacity-60"
                      )}
                    >
                      {busyId === row.id ? "Signing out…" : "Sign out"}
                    </button>
                  ) : null}
                </div>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
