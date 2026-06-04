import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/** Legacy URL — profile is the public member page at /member/{username}. */
export default async function ProfileRedirectPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(`/member/${encodeURIComponent(session.username)}`);
}
