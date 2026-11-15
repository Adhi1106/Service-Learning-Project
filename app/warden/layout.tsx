import { Brand } from "@/components/Brand";
import { IconBox, IconClipboard, IconHome, IconUsers } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";
import { NavLinks } from "@/components/NavLinks";
import { requireRole } from "@/lib/auth";

// Everything under /warden is the warden's phone app. There is no link to
// alerts or health cases here, and the server refuses them for this role.
export default async function WardenLayout({ children }: { children: React.ReactNode }) {
  await requireRole("warden");
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Brand compact />
        <LogoutButton iconOnly className="rounded-full p-2.5 text-slate-500 hover:bg-slate-100" />
      </header>
      <main className="px-4 py-5">{children}</main>
      <NavLinks
        variant="tabs"
        items={[
          { href: "/warden", label: "Today", icon: <IconHome size={20} /> },
          { href: "/warden/attendance", label: "Attendance", icon: <IconClipboard size={20} /> },
          { href: "/warden/stock", label: "Stock", icon: <IconBox size={20} /> },
          { href: "/warden/students", label: "Children", icon: <IconUsers size={20} /> },
        ]}
      />
    </div>
  );
}
