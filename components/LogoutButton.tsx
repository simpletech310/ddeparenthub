import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        title="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-50 hover:text-accent-500"
      >
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" />
        </svg>
      </button>
    </form>
  );
}
