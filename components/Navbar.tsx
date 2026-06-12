"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api";
import type { User } from "@/lib/types";

const NAV_ITEMS: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/projects", label: "Projects" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/quality", label: "Quality & SLA" },
    { href: "/autolabel-review", label: "Autolabel Review" },
  ],
  ml_engineer: [
    { href: "/projects", label: "Projects" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/quality", label: "Quality & SLA" },
    { href: "/autolabel-review", label: "Autolabel Review" },
  ],
  labeler: [{ href: "/label", label: "Label Queue" }],
  reviewer: [
    { href: "/review", label: "Review Queue" },
    { href: "/autolabel-review", label: "Autolabel Review" },
  ],
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  if (pathname === "/login") return null;

  const items = user ? NAV_ITEMS[user.role] || [] : [];

  return (
    <nav className="border-b border-slate-700 bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-primary">
          AV Label Platform
        </Link>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm ${pathname.startsWith(item.href) ? "text-primary font-medium" : "text-slate-400 hover:text-white"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {user.name} <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">{user.role}</span>
          </span>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="text-sm text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
