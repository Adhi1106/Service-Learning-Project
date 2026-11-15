"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: ReactNode; badge?: number };

/** Navigation links that highlight the page you are on. */
export function NavLinks({ items, variant }: { items: NavItem[]; variant: "side" | "tabs" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href.split("/").length <= 2 ? pathname === href : pathname.startsWith(href));

  if (variant === "tabs") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium ${active ? "text-teal-700" : "text-slate-500"}`}
              >
                <span className={`rounded-full px-4 py-0.5 ${active ? "bg-teal-50" : ""}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Main">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className={active ? "text-teal-700" : "text-slate-400"}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-red-700">{item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
