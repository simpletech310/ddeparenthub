import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homePathFor(user.role));
}
