"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { DEPTHS, DEPTH_LABELS, type Depth, type Session } from "@/lib/types";
import { useNarrator } from "./Narrator";
import Chat from "./Chat";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse" />,
});

export default function PatientView({
  session,
  embedded = false,
  initialStep = 0,
}: {
  session: Session;
  embedded?: boolean;
  initialStep?: number;
}) {
  const { plan } = session;
  const [depth, setDepth] = useState<Depth>(session.defaultDepth);
  const [index, setIndex] = useState(Math.max(0, Math.min(session.plan.steps.length, initialStep)));
  const [autoPlay, setAutoPlay] = useState(true);
  const narrator = useNarrator(session.language);

  const total = plan.steps.length;
  const onCare = index === total;
  const step = plan.steps[Math.min(index, total - 1)];

  const clipUrl = (i: number, d: Depth) => `/api/tts?id=${session.id}&step=${i}&depth=${d}`;
  const playStep = (i: number, d: Depth = depth) => {
    if (i < total) narrator.play(clipUrl(i, d), plan.steps[i].narration[d]);
  };

  const go = (i: number) => {
    const next = Math.max(0, Math.min(total, i));
    setIndex(next);
    narrator.stop();
    if (autoPlay && next < total) playStep(next);
  };

  const changeDepth = (d: Depth) => {
    setDepth(d);
    if (narrator.playing) playStep(index, d);
  };

  return (
    <div className={`relative flex flex-col bg-cream ${embedded ? "h-full overflow-y-auto" : "min-h-dvh"}`}>
      <div className={`mx-auto w-full max-w-md flex-1 px-4 pb-24 ${embedded ? "pt-4" : "pt-6"}`}>
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Opero</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight">
            {session.patientName ? `Hi ${session.patientName}, ` : ""}here&apos;s your {plan.procedureName.toLowerCase()}
          </h1>
          <p className="mt-1 text-sm text-subtle">Prepared for you by {session.doctorName}</p>
        </header>

        <div className="mb-4 rounded-2xl border border-line bg-paper p-1" role="radiogroup" aria-label="How much detail would you like?">
          <div className="grid grid-cols-3 gap-1">
            {DEPTHS.map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={depth === d}
                onClick={() => changeDepth(d)}
                className={`rounded-xl px-2 py-2 text-xs font-medium transition ${depth === d ? "bg-teal text-white shadow-sm" : "text-subtle hover:bg-cream"}`}
              >
                {DEPTH_LABELS[d].label}
              </button>
            ))}
          </div>
        </div>

        {!onCare ? (
          <article key={index} className="fade-up overflow-hidden rounded-3xl border border-line bg-paper shadow-sm">
            <div className={`relative h-64 ${step.scene === "sleep" ? "scene-bg-night" : "scene-bg"}`}>
              <Scene3D scene={step.scene} region={step.region} />
              <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-subtle backdrop-blur">
                Step {index + 1} of {total}
              </span>
            </div>
            <div className="space-y-3 p-5">
              <h2 className="font-serif text-xl">{step.title}</h2>
              <p className="leading-relaxed text-ink/85">{step.text[depth]}</p>
              <button
                onClick={() => (narrator.playing ? narrator.stop() : playStep(index))}
                className="flex items-center gap-2 rounded-full bg-teal-soft px-4 py-2 text-sm font-medium text-teal transition active:scale-95"
              >
                <span aria-hidden>{narrator.loading ? "…" : narrator.playing ? "❚❚" : "▶"}</span>
                {narrator.loading ? "Preparing voice" : narrator.playing ? "Pause" : "Listen"}
              </button>
            </div>
          </article>
        ) : (
          <CareSection session={session} />
        )}

        <nav className="mt-4 flex items-center justify-between">
          <button onClick={() => go(index - 1)} disabled={index === 0} className="rounded-full px-4 py-2 text-sm font-medium text-subtle disabled:opacity-30">
            ← Back
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: total + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={i === total ? "Care instructions" : `Step ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-teal" : "w-2 bg-line"}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(index + 1)}
            disabled={onCare}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-30"
          >
            {index === total - 1 ? "Care tips →" : "Next →"}
          </button>
        </nav>

        <label className="mt-3 flex items-center justify-center gap-2 text-xs text-subtle">
          <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} className="accent-teal" />
          Read each step aloud automatically
        </label>
      </div>

      <Chat sessionId={session.id} doctorName={session.doctorName} embedded={embedded} />
    </div>
  );
}

function CareSection({ session }: { session: Session }) {
  const { before, after, callDoctorIf } = session.plan.instructions;
  const block = (title: string, items: string[], tone: string) =>
    items.length > 0 && (
      <section className={`rounded-2xl border p-4 ${tone}`}>
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <ul className="space-y-1.5 text-sm leading-relaxed">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="mt-0.5">•</span>
              {t}
            </li>
          ))}
        </ul>
      </section>
    );
  return (
    <div className="fade-up space-y-3">
      <h2 className="font-serif text-xl">Your care checklist</h2>
      {block("Before your procedure", before, "border-line bg-paper")}
      {block("After your procedure", after, "border-teal/30 bg-teal-soft")}
      {block(`Call ${session.doctorName} if`, callDoctorIf, "border-rose/30 bg-peach-soft")}
      <p className="text-center text-xs text-subtle">If it feels like an emergency, call your local emergency number.</p>
    </div>
  );
}
