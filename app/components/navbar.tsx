import Link from "next/link";
import NavbarAuth from "./navbar-auth";
import NavLinks from "./nav-links";
import MobileNavDrawer from "./mobile-nav-drawer";

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

        {/* Nav links — desktop only */}
        <NavLinks />

        {/* Right side: auth + mobile hamburger */}
        <div className="flex items-center gap-2">
          <NavbarAuth />
          <MobileNavDrawer />
        </div>
      </div>
    </nav>
  );
}
