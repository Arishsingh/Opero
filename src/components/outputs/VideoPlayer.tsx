"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useNarrator } from "@/components/Narrator";
import { DEPTHS, DEPTH_LABELS, type Depth, type Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false, loading: () => <div className="h-full w-full" /> });

/**
 * The "video": the calm 3D scenes play in order, narrated step by step with subtitles.
 * It advances when each voice-over ends, like a real video.
 */
export default function VideoPlayer({ session, className, compact = false }: { session: Session; className?: string; compact?: boolean }) {
  const steps = session.plan.steps;
  const [index, setIndex] = useState(0);
  const [depth, setDepth] = useState<Depth>(session.defaultDepth);
  const [playing, setPlaying] = useState(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  const narrator = useNarrator(session.language, () => setTimeout(next, 700));

  // Speak the current step while playing. If no voice is available, advance on a reading-time timer.
  useEffect(() => {
    if (fallback.current) clearTimeout(fallback.current);
    if (!playing) {
      narrator.stop();
      return;
    }
    const text = steps[index].narration[depth];
    const clip = (i: number) => `/api/tts?id=${session.id}&step=${i}&depth=${depth}`;
    narrator.play(clip(index), text).then((mode) => {
      // Only when there's no voice at all, advance on a reading-time timer.
      if (mode === "none") fallback.current = setTimeout(next, Math.max(6000, text.split(/\s+/).length * 420));
    });
    // Prepare the next step's voice while this one plays, so scenes flow without waiting.
    if (index + 1 < steps.length) fetch(clip(index + 1)).catch(() => {});
    return () => {
      if (fallback.current) clearTimeout(fallback.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the step, depth or play state changes
  }, [index, depth, playing]);

  useEffect(() => () => narrator.stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[index];
  const go = (i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i)));

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-[#1E1433] text-white", className)}>
      <div className={cn("relative", compact ? "aspect-[4/3]" : "aspect-video")}>
        <div className={cn("absolute inset-0", step.scene === "sleep" ? "scene-bg-night" : "scene-bg")}>
          <Scene3D scene={step.scene} region={step.region} />
        </div>

        {/* Progress segments, like stories */}
        <div className="absolute inset-x-3 top-3 flex gap-1">
          {steps.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Go to step ${i + 1}`} className="h-1 flex-1 overflow-hidden rounded-full bg-black/15">
              <motion.span
                className="block h-full rounded-full bg-[#1E1433]/70"
                initial={false}
                animate={{ width: i < index ? "100%" : i === index ? (playing ? "100%" : "35%") : "0%" }}
                transition={i === index && playing ? { duration: 8, ease: "linear" } : { duration: 0.3 }}
              />
            </button>
          ))}
        </div>
        <span className="absolute left-3 top-6 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#1E1433] backdrop-blur">
          {index + 1}/{steps.length} · {step.title}
        </span>

        {/* Subtitles */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-4 pb-4 pt-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${index}-${depth}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("mx-auto max-w-[640px] text-center leading-snug drop-shadow", compact ? "text-xs" : "text-sm sm:text-base")}
            >
              {step.text[depth]}
            </motion.p>
          </AnimatePresence>
        </div>

        {!playing && (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center" aria-label="Play video">
            <motion.span whileHover={{ scale: 1.08 }} className="grid size-14 place-items-center rounded-full bg-white/90 text-[#1E1433] shadow-xl">
              <Play className="ml-0.5 size-6" fill="currentColor" />
            </motion.span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 px-3 py-2.5">
        <button onClick={() => go(index - 1)} aria-label="Previous step" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
          <SkipBack className="size-4" />
        </button>
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="grid size-8 place-items-center rounded-full bg-white text-[#1E1433]">
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
        </button>
        <button onClick={() => go(index + 1)} aria-label="Next step" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
          <SkipForward className="size-4" />
        </button>
        <span className="ml-1 text-xs text-white/60">{narrator.loading ? "Preparing voice…" : session.language}</span>
        <div className="ml-auto flex rounded-full bg-white/10 p-0.5 text-[11px]">
          {DEPTHS.map((d) => (
            <button key={d} onClick={() => setDepth(d)} className={cn("rounded-full px-2 py-1 transition", depth === d ? "bg-white text-[#1E1433]" : "text-white/70 hover:text-white")}>
              {compact ? DEPTH_LABELS[d].label.split(" ").slice(-1)[0] : DEPTH_LABELS[d].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
