import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignupView from "@/components/SignupView";
import { getSignedInEmail } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign up — Opero",
  description: "Create your Opero account and send your first calm procedure walkthrough.",
};

export default async function SignupPage() {
  if (await getSignedInEmail()) redirect("/dashboard");
  return <SignupView />;
}
