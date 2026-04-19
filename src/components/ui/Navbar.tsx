"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/compare", label: "Compare" },
  { href: "/ai-coach", label: "AI Coach" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
          Code<span className="text-indigo-400">ship</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white md:block"
          >
            Sign out
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-800 px-4 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
