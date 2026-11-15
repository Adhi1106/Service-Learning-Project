import { LogoutButton } from "@/components/LogoutButton";
import { NavLinks } from "@/components/NavLinks";
import { requireRole } from "@/lib/auth";

// Everything under /warden is the warden's phone app. There is no link to
// alerts or health cases here, and the server refuses them for this role.
export default async function WardenLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("warden");
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-lg font-semibold leading-tight tracking-tight text-teal-800">CareTrack</p>
          <p className="text-xs text-slate-500">{user.name}</p>
        </div>
        <LogoutButton className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" />
      </header>
      <main className="px-4 py-5">{children}</main>
      <NavLinks
        variant="tabs"
        items={[
          { href: "/warden", label: "Home" },
          { href: "/warden/attendance", label: "Attendance" },
          { href: "/warden/stock", label: "Stock" },
          { href: "/warden/students", label: "Students" },
        ]}
      />
    </div>
  );
}
