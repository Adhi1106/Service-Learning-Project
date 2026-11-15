import { redirect } from "next/navigation";
import { Brand, LogoMark } from "@/components/Brand";
import { getUser, homeFor } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-teal-800 p-12 text-teal-50 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <span className="text-lg font-semibold text-white">Grace and Light Trust</span>
        </div>
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-snug text-white">Every child seen, every day.</p>
          <p className="mt-4 text-base leading-relaxed text-teal-100">
            Daily attendance, health follow-ups and stores for the children&apos;s home in Hoskote, in one place for the warden
            and the manager.
          </p>
        </div>
        <p className="text-sm text-teal-200">Hoskote, Karnataka</p>
        <svg className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 text-teal-700/60" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="99" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Brand />
          </div>
          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-slate-900 lg:mt-0">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use the account given to you by the trust office.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
