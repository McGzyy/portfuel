import Link from "next/link";

export function WorkspaceBackLink({
  href = "/dashboard",
  label = "Workspace",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex text-sm font-medium text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
    >
      ← {label}
    </Link>
  );
}
