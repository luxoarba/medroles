"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import { signOut } from "@/lib/auth";

export default function NavbarAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "INITIAL_SESSION") setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  if (loading) {
    // Render same width as sign-in link to avoid layout shift
    return <span className="hidden sm:block w-16 h-5" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[160px] truncate text-sm text-gray-500 sm:block">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors sm:block px-3 py-2"
    >
      Sign in
    </Link>
  );
}
