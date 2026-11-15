import { redirect } from "next/navigation";
import { getUser, homeFor } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-teal-800">CareTrack</h1>
      <p className="mt-1 text-sm text-slate-600">Attendance, health and stock for Grace and Light Trust.</p>
      <LoginForm />
      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Demonstration build. All children, records and stock shown here are invented. No real data is stored.
      </p>
    </main>
  );
}
