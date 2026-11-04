import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardClientShell } from "./DashboardClientShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <DashboardClientShell user={session}>{children}</DashboardClientShell>;
}

