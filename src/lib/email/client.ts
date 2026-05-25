import { Resend } from "resend";
import { getEmailFrom, isEmailConfigured } from "@/lib/email/config";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY!.trim());
  }
  return resend;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendPortfuelEmail(input: SendEmailInput): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const { error } = await client.emails.send({
    from: getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    console.error("[email/send]", error);
    return false;
  }
  return true;
}
