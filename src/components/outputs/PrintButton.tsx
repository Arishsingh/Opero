"use client";

import { useEffect } from "react";

/** "Download PDF": opens the browser's print dialog (Save as PDF). With autoPrint it opens on arrival. */
export default function PrintButton({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 700); // let pictures finish loading first
    return () => clearTimeout(t);
  }, [autoPrint]);
  return (
    <button onClick={() => window.print()} className="rounded-full bg-[#1E1433] px-5 py-2.5 text-sm font-medium text-white print:hidden">
      Download PDF
    </button>
  );
}
