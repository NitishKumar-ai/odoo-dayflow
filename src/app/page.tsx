import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/** The landing route only decides where to send you, so it must read the cookie per request. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/signin");
}
