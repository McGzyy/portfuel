"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushAlertsControl({
  pushConfigured,
  pushEnabled,
  onStatusChange,
}: {
  pushConfigured: boolean;
  pushEnabled: boolean;
  onStatusChange?: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      const keyData = (await keyRes.json()) as { configured?: boolean; publicKey?: string };
      if (!keyData.configured || !keyData.publicKey) {
        setError("Push is not configured on this environment yet.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was denied.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!res.ok) {
        setError("Could not save push subscription.");
        return;
      }

      setMessage("Browser push enabled for watchlist alerts.");
      onStatusChange?.();
    } catch {
      setError("Could not enable push notifications.");
    } finally {
      setBusy(false);
    }
  }, [onStatusChange]);

  const disable = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setMessage("Browser push disabled.");
      onStatusChange?.();
    } catch {
      setError("Could not disable push notifications.");
    } finally {
      setBusy(false);
    }
  }, [onStatusChange]);

  if (!supported) {
    return (
      <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
        Install PortFuel on your home screen (Safari / Chrome) to use browser push alerts.
      </p>
    );
  }

  if (!pushConfigured) {
    return (
      <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Push notifications are not configured on this environment yet (VAPID keys missing).
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-[var(--pf-gray-500)]">
        Get watchlist price, earnings, plan-level, and community call alerts on your phone or
        desktop — works best when PortFuel is installed as an app.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {pushEnabled ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void disable()}
            className="pf-chip-action px-4 py-2 text-sm disabled:opacity-60"
          >
            {busy ? "Updating…" : "Disable browser push"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="rounded-lg bg-[var(--pf-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pf-red-hover)] disabled:opacity-60"
          >
            {busy ? "Enabling…" : "Enable browser push"}
          </button>
        )}
        {pushEnabled ? (
          <span className="text-xs font-semibold text-emerald-700">Push active</span>
        ) : null}
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}
    </div>
  );
}
