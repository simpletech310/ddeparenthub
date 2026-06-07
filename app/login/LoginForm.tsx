"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/lib/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full" type="submit" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(login, {});
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="maria@example.com"
          defaultValue="maria@example.com"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          placeholder="••••"
          defaultValue="demo"
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm font-medium text-accent-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
