import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { redirect } from "next/navigation";
import { NewCallForm } from "./NewCallForm";

export default async function NewCallPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <NewCallForm user={toHeaderUser(session)} />;
}
