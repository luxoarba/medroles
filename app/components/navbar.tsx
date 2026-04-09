import Link from "next/link";
import NavbarAuth from "./navbar-auth";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 shadow-sm group-hover:bg-emerald-700 transition-colors">
            <span className="h-3 w-3 rounded-full bg-white/90" />
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-300 opacity-60" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-gray-900">
            Med<span className="text-emerald-600">Roles</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link
            href="/jobs"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Browse Jobs
          </Link>
          <Link
            href="/trusts"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Trusts
          </Link>
          <Link
            href="#"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Reviews
          </Link>
          <Link
            href="#"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Interview Intel
          </Link>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <NavbarAuth />
        </div>
      </div>
    </nav>
  );
}
