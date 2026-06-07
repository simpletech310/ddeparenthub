import { logout } from "@/lib/auth/actions";
import { updateMyAvatarAction, updateMyProfileAction } from "@/lib/account/actions";
import { AvatarUpload } from "./AvatarUpload";
import type { User } from "@/lib/types";

// Shared "your account" block — photo, name, (staff) title, language, sign out.
export function AccountPanel({ user }: { user: User }) {
  return (
    <div className="space-y-5">
      <section className="card">
        <h2 className="mb-3 font-display font-bold text-ink-900">Your photo</h2>
        <AvatarUpload name={user.name} currentSrc={user.avatarUrl} action={updateMyAvatarAction} />
        <p className="mt-3 text-xs text-ink-400">A friendly photo helps your families recognize you. Square images look best.</p>
      </section>

      <form action={updateMyProfileAction} className="card space-y-4">
        <h2 className="font-display font-bold text-ink-900">Profile</h2>
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" className="input" defaultValue={user.name} />
        </div>
        {user.role === "staff" && (
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" className="input" defaultValue={user.title ?? ""} placeholder="BCBA · Behavior Technician" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="preferredLanguage">Language</label>
          <select id="preferredLanguage" name="preferredLanguage" className="input" defaultValue={user.preferredLanguage}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <p className="text-xs text-ink-400">{user.email}</p>
        <button className="btn-primary w-full" type="submit">Save profile</button>
      </form>

      <form action={logout} className="card flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-ink-900">Sign out</h2>
          <p className="text-sm text-ink-500">End your session on this device.</p>
        </div>
        <button className="btn-ghost" type="submit">Sign out</button>
      </form>
    </div>
  );
}
