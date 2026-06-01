import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { DiscordLinkClient } from "@/app/discord/link/DiscordLinkClient";

export default async function DiscordLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) {
    const sp = await searchParams;
    const token = typeof sp.token === "string" ? sp.token : "";
    redirect(`/login?next=${encodeURIComponent(`/discord/link?token=${token}`)}`);
  }

  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  if (!token) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-14">
        <h1 className="text-2xl font-semibold tracking-tight">Discord link</h1>
        <p className="mt-3 text-sm text-[var(--pf-gray-600)]">
          Missing token. Please use the link sent to you by the Discord bot.
        </p>
        <div className="mt-6">
          <Link className="text-sm font-semibold text-[var(--pf-red)] hover:underline" href="/dashboard">
            Go to dashboard →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight">Link Discord</h1>
      <p className="mt-3 text-sm text-[var(--pf-gray-600)]">
        This will connect your Discord account to PortFuel so we can assign your member/pro roles.
      </p>
      <DiscordLinkClient token={token} />
    </main>
  );
}

