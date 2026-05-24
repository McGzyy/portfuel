import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NewCallForm } from "./NewCallForm";

export default async function NewCallPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <NewCallForm userPin={session.pin} />;
}
