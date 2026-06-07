import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10 text-center">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="animate-fade-up">
        <span
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl font-display text-3xl font-bold text-white shadow-glow"
          style={{ backgroundImage: "linear-gradient(135deg,#00a2e8,#019e7c)" }}
        >
          D
        </span>
        <p className="font-display text-5xl font-bold text-ink-900">404</p>
        <h1 className="mt-2 font-display text-xl font-bold text-ink-900">Page not found</h1>
        <p className="mt-1 text-sm text-ink-500">The page you're looking for doesn't exist or has moved.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Back to home</Link>
      </div>
    </main>
  );
}
