import { existsSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard/Dashboard";
import { getSignedInEmail } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard — Opero" };

export default async function DashboardPage() {
  const email = await getSignedInEmail();
  if (!email) redirect("/signup");
  // Optional background photo: save one at public/dashboard-bg.jpg to use it.
  const photo = existsSync(path.join(process.cwd(), "public", "dashboard-bg.jpg"));
  return <Dashboard userEmail={email} photo={photo} />;
}
