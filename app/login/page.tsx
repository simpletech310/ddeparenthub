import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/lib/auth/session";
import { quickLogin } from "@/lib/auth/actions";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
          D
        </div>
        <h1 className="text-2xl font-bold text-brand-900">DDE Parent Hub</h1>
        <p className="mt-1 text-sm text-brand-700">
          Understand · Learn · Track — with Data Driven Educators
        </p>
      </div>

      <div className="card">
        <LoginForm />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-brand-600">
          Prototype quick login
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["parent", "staff", "admin"] as const).map((role) => (
            <form key={role} action={quickLogin.bind(null, role)}>
              <button className="btn-ghost w-full capitalize" type="submit">
                {role}
              </button>
            </form>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-brand-500">
          Demo accounts use password <span className="font-mono">demo</span>.
        </p>
      </div>
    </main>
  );
}
