"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f8f9fa",
          color: "#0f1419",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "24rem",
              width: "100%",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              PortFuel hit an error
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#536471", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
              Something unexpected happened. Reload the app or try again in a moment.
            </p>
            {error.digest ? (
              <p style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "monospace" }}>
                Ref: {error.digest}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#e31b23",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: "0.5rem 1rem",
                  background: "#f3f4f6",
                  color: "#0f1419",
                  borderRadius: "8px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Overview
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
