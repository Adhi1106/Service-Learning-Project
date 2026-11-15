"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number };

/** Navigation links that highlight the page you are on. */
export function NavLinks({ items, variant }: { items: NavItem[]; variant: "side" | "tabs" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href.split("/").length <= 2 ? pathname === href : pathname.startsWith(href));

  if (variant === "tabs") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex-1 py-3.5 text-center text-sm font-medium ${
              isActive(item.href) ? "border-t-2 border-teal-700 text-teal-800" : "border-t-2 border-transparent text-slate-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
            isActive(item.href) ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {item.label}
          {item.badge ? (
            <span
              className={`rounded-full px-2 text-xs tabular-nums ${
                isActive(item.href) ? "bg-white/20 text-white" : "bg-red-100 text-red-800"
              }`}
            >
              {item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
