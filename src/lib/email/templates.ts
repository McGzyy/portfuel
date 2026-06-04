import { getAppUrl } from "@/lib/email/config";

function layout(opts: { title: string; bodyHtml: string; ctaHref?: string; ctaLabel?: string }): {
  html: string;
  text: string;
} {
  const base = getAppUrl();
  const cta =
    opts.ctaHref && opts.ctaLabel
      ? `<p style="margin:24px 0 0"><a href="${opts.ctaHref}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${opts.ctaLabel}</a></p>`
      : "";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#64748b">PortFuel</p>
  <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${opts.title}</h1>
  ${opts.bodyHtml}
  ${cta}
  <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">Manage alerts in <a href="${base}/settings">Settings</a> · <a href="${base}/dashboard/notifications">Notifications</a></p>
</div></body></html>`;

  const textBody = opts.bodyHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const text = `${opts.title}\n\n${textBody}${
    opts.ctaHref && opts.ctaLabel ? `\n\n${opts.ctaLabel}: ${opts.ctaHref}` : ""
  }\n\nSettings: ${base}/settings`;

  return { html, text };
}

export function instantNotificationEmail(opts: {
  title: string;
  body: string;
  href: string;
}): { subject: string; html: string; text: string } {
  const href = opts.href.startsWith("http") ? opts.href : `${getAppUrl()}${opts.href}`;
  const { html, text } = layout({
    title: opts.title,
    bodyHtml: `<p style="margin:0;line-height:1.6;color:#334155">${escapeHtml(opts.body)}</p>`,
    ctaHref: href,
    ctaLabel: "Open in PortFuel",
  });
  return { subject: `[PortFuel] ${opts.title}`, html, text };
}

export function weeklyDigestEmail(opts: {
  displayName: string;
  sections: { heading: string; lines: string[] }[];
}): { subject: string; html: string; text: string } {
  const bodyHtml = opts.sections
    .map(
      (s) =>
        `<h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#64748b">${escapeHtml(s.heading)}</h2><ul style="margin:0;padding-left:20px;color:#334155;line-height:1.6">${s.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
    )
    .join("");

  const { html, text } = layout({
    title: `Your week on PortFuel, ${opts.displayName}`,
    bodyHtml,
    ctaHref: `${getAppUrl()}/dashboard`,
    ctaLabel: "Open workspace",
  });

  return { subject: "Your PortFuel week — desk portfolio & performance", html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
