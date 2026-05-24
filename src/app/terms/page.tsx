import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-2xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-[var(--pf-gray-600)]">Placeholder — add legal terms before paid launch.</p>
      <Link href="/" className="mt-8 inline-block text-[var(--pf-red)] hover:underline">
        ← Home
      </Link>
    </div>
  );
}
