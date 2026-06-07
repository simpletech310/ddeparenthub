"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to the console for debugging; a real deployment would log to a service.
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10 text-center">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-300/30 blur-3xl" />
      <div className="animate-fade-up">
        <span
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl text-3xl text-white shadow-glow"
          style={{ backgroundImage: "linear-gradient(135deg,#ff7a59,#f85a32)" }}
          aria-hidden
        >
          !
        </span>
        <h1 className="font-display text-xl font-bold text-ink-900">Something went wrong</h1>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          An unexpected error occurred. You can try again, or head back home.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-ghost">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
