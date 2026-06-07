import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
      >
        Sign out
      </button>
    </form>
  );
}
