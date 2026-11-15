"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "./icons";

export function LogoutButton({ className = "", iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className={className} title="Log out" aria-label="Log out">
      <IconLogout size={18} />
      {!iconOnly && <span>Log out</span>}
    </button>
  );
}
