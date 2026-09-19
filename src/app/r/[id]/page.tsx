import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/store";
import Report from "@/components/outputs/Report";
import PrintButton from "@/components/outputs/PrintButton";

export const metadata: Metadata = { title: "Your procedure report — Opero", robots: { index: false, follow: false } };

export default async function ReportPage({ params, searchParams }: PageProps<"/r/[id]">) {
  const { id } = await params;
  const { print } = await searchParams;
  const session = await getSession(id);
  if (!session) notFound();
  return (
    <main className="min-h-dvh bg-[#F4EFEC] px-4 py-8 print:bg-white print:p-0" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto mb-4 flex max-w-3xl justify-end print:hidden">
        <PrintButton autoPrint={print === "1"} />
      </div>
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:p-0 print:shadow-none">
        <Report session={session} depth={session.defaultDepth} />
      </div>
    </main>
  );
}
