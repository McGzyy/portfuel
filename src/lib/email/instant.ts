import { sendPortfuelEmail } from "@/lib/email/client";
import { fetchEmailPrefs, shouldSendInstantEmail } from "@/lib/email/preferences";
import { instantNotificationEmail } from "@/lib/email/templates";
import { isEmailConfigured } from "@/lib/email/config";
import type { NotificationType } from "@/lib/notifications/types";

export async function maybeSendInstantNotificationEmail(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const prefs = await fetchEmailPrefs(opts.userId);
  if (!prefs || !shouldSendInstantEmail(opts.type, prefs)) return;

  const email = prefs.notifyEmail!.trim();
  const tpl = instantNotificationEmail({
    title: opts.title,
    body: opts.body,
    href: opts.href,
  });

  await sendPortfuelEmail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}
