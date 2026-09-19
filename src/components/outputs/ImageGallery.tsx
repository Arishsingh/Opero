"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import type { Depth, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One calm illustration per step, with a plain-language caption. Click to enlarge. */
export default function ImageGallery({ session, depth = "standard", columns = 2 }: { session: Session; depth?: Depth; columns?: 2 | 3 }) {
  const [open, setOpen] = useState<number | null>(null);
  const images = session.images ?? [];
  const steps = session.plan.steps;

  if (!images.length) {
    return <p className="rounded-2xl bg-black/[0.03] p-6 text-center text-sm text-muted-foreground">Pictures are being prepared…</p>;
  }

  return (
    <>
      <div className={cn("grid gap-3", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
        {images.map((src, i) => (
          <motion.button
            key={i}
            onClick={() => setOpen(i)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-left shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from our own renderer */}
            <img src={src} alt={steps[i]?.title ?? `Step ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
            <p className="truncate px-3 py-2 text-xs font-medium">
              {i + 1}. {steps[i]?.title}
            </p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <motion.figure
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[open]} alt={steps[open]?.title} className="w-full" />
              <figcaption className="flex items-start gap-3 p-5 text-[#192837]">
                <div className="flex-1">
                  <p className="font-medium">
                    {open + 1}. {steps[open]?.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-black/60">{steps[open]?.text[depth]}</p>
                </div>
                <a href={images[open]} download={`step-${open + 1}.jpg`} className="grid size-9 shrink-0 place-items-center rounded-full border border-black/10 hover:bg-black/5" aria-label="Download image">
                  <Download className="size-4" />
                </a>
                <button onClick={() => setOpen(null)} className="grid size-9 shrink-0 place-items-center rounded-full border border-black/10 hover:bg-black/5" aria-label="Close">
                  <X className="size-4" />
                </button>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
