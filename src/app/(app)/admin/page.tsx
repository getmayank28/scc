import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { isAdmin } from "@/lib/constants/admin"
import { getServerSession } from "next-auth";
import AdminDashboard from "./Dashboard";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const admin = isAdmin(session?.user?.email)

  if (!admin) {
    redirect("/")
  }
  return <AdminDashboard/>
}
