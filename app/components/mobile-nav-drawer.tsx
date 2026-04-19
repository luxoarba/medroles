"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/trusts", label: "Trusts" },
    { href: "/reviews", label: "Reviews" },
    { href: "/interview-intel", label: "Interview Intel" },
  ];

  const overlay = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: "75%", maxWidth: "320px",
        background: "#ffffff", boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#059669" }}>
              <span style={{ height: "10px", width: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "block" }} />
            </span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>
              Med<span style={{ color: "#059669" }}>Roles</span>
            </span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            style={{ display: "flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px" }}>
          {links.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "12px 16px", borderRadius: "12px",
                  fontSize: "15px", fontWeight: 500, textDecoration: "none",
                  marginBottom: "4px",
                  color: isActive ? "#059669" : "#374151",
                  background: isActive ? "#ecfdf5" : "transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign in */}
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "12px" }}>
          <Link
            href="/auth"
            style={{
              display: "flex", alignItems: "center",
              padding: "12px 16px", borderRadius: "12px",
              fontSize: "15px", fontWeight: 500, textDecoration: "none",
              color: "#374151",
            }}
          >
            Sign in / My account
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors sm:hidden"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {mounted && open && createPortal(overlay, document.body)}
    </>
  );
}
