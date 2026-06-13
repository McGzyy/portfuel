"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (json.error === "invalid_current_password") {
          setError("Current password is incorrect.");
        } else if (json.error === "invalid_password") {
          setError(json.message ?? "Password must be 8–128 characters with a letter and a number.");
        } else if (json.error === "same_password") {
          setError("New password must be different from your current password.");
        } else {
          setError("Could not update password.");
        }
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch {
      setError("Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pf-workspace-panel p-5 sm:p-6">
      <h2 className="text-base font-bold text-[var(--foreground)]">Password</h2>
      <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
        Update your sign-in password. You will stay signed in on this device.
      </p>

      <div className="mt-5 max-w-md space-y-4">
        <div>
          <label htmlFor="current-password" className="text-xs font-semibold text-[var(--pf-gray-700)]">
            Current password
          </label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="text-xs font-semibold text-[var(--pf-gray-700)]">
            New password
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1 text-[11px] text-[var(--pf-gray-500)]">
            At least 8 characters with one letter and one number.
          </p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="text-xs font-semibold text-[var(--pf-gray-700)]">
            Confirm new password
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-medium text-emerald-600">{message}</p> : null}

      <div className="mt-5">
        <Button
          type="button"
          disabled={busy || !currentPassword || !newPassword || !confirmPassword}
          onClick={() => void submit()}
        >
          {busy ? "Updating…" : "Update password"}
        </Button>
      </div>
    </div>
  );
}
