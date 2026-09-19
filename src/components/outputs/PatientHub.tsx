"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Download,
  FileText,
  HeartPulse,
  Images,
  ListChecks,
  PhoneCall,
  PlayCircle,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Chat from "@/components/Chat";
import VideoPlayer from "./VideoPlayer";
import ImageGallery from "./ImageGallery";
import { ALL_OUTPUTS, DEPTHS, DEPTH_LABELS, type Depth, type Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

function Section({ id, icon: Icon, title, children, tone = "plain" }: { id: string; icon: LucideIcon; title: string; children: ReactNode; tone?: "plain" | "soft" | "warn" }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(
        "scroll-mt-20 rounded-3xl p-5 sm:p-6",
        tone === "soft" && "bg-[#F4EEFB]",
        tone === "warn" && "border border-rose-200 bg-rose-50",
        tone === "plain" && "bg-white shadow-[0_1px_3px_rgba(40,20,50,0.06)]",
      )}
    >
      <h2 className={cn("mb-3 flex items-center gap-2 text-lg font-semibold", tone === "warn" && "text-rose-900")}>
        <Icon className={cn("size-5", tone === "warn" ? "text-rose-600" : "text-[#4A1D96]")} />
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 leading-relaxed">
          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-current opacity-40" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The page a patient opens from WhatsApp/SMS: who it's from, what's happening in their body,
 * the plan and why, then the video / pictures / report their doctor chose, and how to look after themselves.
 */
export default function PatientHub({ session }: { session: Session }) {
  const { plan } = session;
  const outputs = session.outputs ?? ALL_OUTPUTS;
  const [depth, setDepth] = useState<Depth>(session.defaultDepth);
  const date = new Date(session.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const { before, after, callDoctorIf } = plan.instructions;
  const approach = plan.approach;
  const hasPictures = outputs.images && !!session.images?.length;
  const hasCare = before.length + after.length + callDoctorIf.length > 0;

  const jump: { id: string; label: string; show: boolean }[] = [
    { id: "problem", label: "Your condition", show: !!plan.condition },
    { id: "solution", label: "The plan", show: true },
    { id: "video", label: "Video", show: outputs.video },
    { id: "pictures", label: "Pictures", show: hasPictures },
    { id: "care", label: "Care", show: hasCare },
    { id: "report", label: "Report", show: outputs.report },
  ];

  return (
    <div className="min-h-dvh bg-[#FBF7F5]" style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      {/* Quick navigation */}
      <nav aria-label="Sections" className="sticky top-0 z-20 border-b border-black/[0.05] bg-[#FBF7F5]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
          {jump
            .filter((j) => j.show)
            .map((j) => (
              <a key={j.id} href={`#${j.id}`} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black/70 shadow-sm transition hover:text-black">
                {j.label}
              </a>
            ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-32 pt-5">
        {/* From your doctor */}
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="space-y-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4A1D96]">Opero · Your care, explained</p>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-3xl">
            {session.patientName ? `Hi ${session.patientName}, ` : ""}here&apos;s everything about your {plan.procedureName.toLowerCase()}
          </h1>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(40,20,50,0.06)]">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#F4B8CF] to-[#C9B6F2] text-[#1E1433]">
              <Stethoscope className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-black/50">Prepared for you by</p>
              <p className="truncate font-semibold">{session.doctorName}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs text-black/50">
              <CalendarDays className="size-3.5" /> {date}
            </span>
          </div>
          <p className="leading-relaxed text-black/75">{plan.summary[depth]}</p>

          {/* Anxiety Control */}
          <div className="space-y-1.5">
            <p className="text-xs text-black/50">How much detail would you like?</p>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/[0.04] p-1" role="radiogroup" aria-label="Detail level">
              {DEPTHS.map((d) => (
                <button
                  key={d}
                  role="radio"
                  aria-checked={depth === d}
                  onClick={() => setDepth(d)}
                  className={cn("relative rounded-xl py-2 text-xs font-medium transition", depth === d ? "text-[#1E1433]" : "text-black/50")}
                >
                  {depth === d && <motion.span layoutId="hub-depth" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
                  <span className="relative">{DEPTH_LABELS[d].label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        {/* The problem */}
        {plan.condition && (
          <Section id="problem" icon={HeartPulse} title="What's happening in your body" tone="soft">
            <p className="mb-1.5 text-sm font-semibold text-[#4A1D96]">{plan.condition.name}</p>
            <p className="leading-relaxed">{plan.condition.explanation[depth]}</p>
          </Section>
        )}

        {/* The solution */}
        <Section id="solution" icon={Sparkles} title="The plan, and why it's right for you">
          <p className="mb-3 font-medium">{plan.procedureName}</p>
          {approach && approach.whyThisPlan.length > 0 ? (
            <Bullets items={approach.whyThisPlan} />
          ) : (
            <p className="leading-relaxed text-black/70">{session.doctorName} chose this plan for you. You can always ask them why it&apos;s the best fit.</p>
          )}
          {approach && approach.otherOptions.length > 0 && (
            <div className="mt-4 rounded-2xl bg-black/[0.03] p-4">
              <p className="mb-2 text-sm font-semibold">Other options {session.doctorName} considered</p>
              <ul className="space-y-1.5 text-sm">
                {approach.otherOptions.map((o) => (
                  <li key={o.name}>
                    <span className="font-medium">{o.name}:</span> <span className="text-black/70">{o.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {approach?.outlook && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 leading-relaxed text-emerald-950">{approach.outlook}</p>}
        </Section>

        {/* Video */}
        {outputs.video && (
          <Section id="video" icon={PlayCircle} title="Watch: what will happen">
            <VideoPlayer session={session} compact />
            <p className="mt-2 text-xs text-black/50">Press play. A calm voice explains each step, with subtitles.</p>
          </Section>
        )}

        {/* Pictures */}
        {hasPictures && (
          <Section id="pictures" icon={Images} title="Step by step, in pictures">
            <ImageGallery session={session} depth={depth} />
          </Section>
        )}

        {/* Care checklist — always shown: it's how the patient stays safe */}
        {hasCare && (
          <div id="care" className="scroll-mt-20 space-y-4">
            {before.length > 0 && (
              <Section id="care-before" icon={ListChecks} title="Getting ready">
                <Bullets items={before} />
              </Section>
            )}
            {after.length > 0 && (
              <Section id="care-after" icon={HeartPulse} title="Looking after yourself" tone="soft">
                <Bullets items={after} />
              </Section>
            )}
            {callDoctorIf.length > 0 && (
              <Section id="care-call" icon={PhoneCall} title={`Call ${session.doctorName} if`} tone="warn">
                <div className="text-rose-950">
                  <Bullets items={callDoctorIf} />
                </div>
                <p className="mt-3 text-sm text-rose-900/80">If it feels like an emergency, call your local emergency number.</p>
              </Section>
            )}
          </div>
        )}

        {/* Report */}
        {outputs.report && (
          <Section id="report" icon={FileText} title="Your full report">
            <p className="mb-4 leading-relaxed text-black/70">
              Everything above in one easy-to-read document{hasPictures ? ", with pictures" : ""}, plus the medical words explained. Keep it, print it, or share it with
              family.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/r/${session.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#1E1433] px-5 py-3 text-sm font-medium text-white">
                <FileText className="size-4" /> Open report
              </a>
              <a href={`/r/${session.id}?print=1`} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium">
                <Download className="size-4" /> Download PDF
              </a>
            </div>
          </Section>
        )}

        <p className="px-2 pt-2 text-center text-xs leading-relaxed text-black/40">
          This explains your care in everyday words, based on {session.doctorName}&apos;s notes. It does not replace medical advice. Tap &ldquo;Ask a question&rdquo;
          anytime.
        </p>
      </main>

      <Chat sessionId={session.id} doctorName={session.doctorName} />
    </div>
  );
}
