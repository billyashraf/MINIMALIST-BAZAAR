"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = { label: string; href: string; indent?: boolean };

const baseNav: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Products", href: "/dashboard/products" },
  { label: "Import product", href: "/dashboard/products/import", indent: true },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Analytics & Affiliates", href: "/dashboard/analytics" },
];

const adminNav: NavItem[] = [{ label: "Users", href: "/dashboard/users" }];

interface Props {
  user: { name?: string | null; email?: string | null; role?: string | null };
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const nav = user.role === "admin" ? [...baseNav, ...adminNav] : baseNav;

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-gray-100 px-4 py-6">
      <Link href="/" className="text-lg font-bold tracking-tight px-2 mb-8">
        Minimalist Bazaar
      </Link>

      <nav className="flex-1 space-y-1">
        {nav.map(({ label, href, indent }) => {
          const active =
            href === "/dashboard" ? pathname === href : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                indent ? "ml-3 text-xs" : ""
              } ${
                active
                  ? "bg-black text-white font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {indent && <span className="mr-1 opacity-50">↳</span>}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 pt-4 mt-4">
        <p className="px-3 text-xs text-gray-500 truncate mb-0.5">{user.email}</p>
        {user.role && (
          <p className="px-3 text-xs text-gray-400 capitalize mb-2">{user.role}</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
