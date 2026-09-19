import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/store";
import PatientHub from "@/components/outputs/PatientHub";

export const metadata: Metadata = {
  title: "Your procedure, explained — Opero",
  robots: { index: false, follow: false },
};

export default async function PatientPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  return <PatientHub session={session} />;
}
