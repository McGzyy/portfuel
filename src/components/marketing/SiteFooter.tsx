import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--pf-border)] bg-[var(--pf-black)] text-[var(--pf-gray-400)]">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="brightness-0 invert">
              <Logo href="/" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Professional stock and crypto call tracking for serious traders — live performance,
              community theses, and ranked callers.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white">Product</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/join" className="hover:text-white">
                  Join the Squad
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white">Legal</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs">
          <p className="text-[var(--pf-gray-500)]">
            Not investment advice. Trading involves substantial risk of loss.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} PortFuel.pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
