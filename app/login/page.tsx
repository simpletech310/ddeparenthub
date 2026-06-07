import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/lib/auth/session";
import { quickLogin } from "@/lib/auth/actions";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-10">
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl" />

      <div className="mx-auto w-full max-w-md animate-fade-up">
        <div className="mb-7 text-center">
          <span
            className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl font-display text-3xl font-bold text-white shadow-glow"
            style={{ backgroundImage: "linear-gradient(135deg,#00a2e8,#019e7c)" }}
          >
            D
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-sun-400" />
          </span>
          <h1 className="font-display text-3xl font-bold text-ink-900">
            DDE <span className="gradient-text">Parent Hub</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Understand · Learn · Track — with Data Driven Educators
          </p>
        </div>

        <div className="card shadow-card">
          <LoginForm />
        </div>

        <div className="mt-6">
          <p className="mb-2.5 text-center eyebrow">Quick demo login</p>
          <div className="grid grid-cols-3 gap-2">
            {(["parent", "staff", "admin"] as const).map((role) => (
              <form key={role} action={quickLogin.bind(null, role)}>
                <button className="btn-ghost w-full capitalize" type="submit">
                  {role}
                </button>
              </form>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-ink-400">
            Demo accounts use password{" "}
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-ink-600">demo</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
