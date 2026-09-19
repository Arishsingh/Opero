"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import IOSMessageList, { type Message } from "./IOSMessageList";
import { AnimatePresence, motion, useInView, type Variants } from "framer-motion";
import {
  ArrowRightCircle,
  AudioLines,
  Ban,
  BookCheck,
  Box,
  Clock,
  Columns2,
  Globe,
  MessageCircleQuestion,
  Mic,
  Plus,
  QrCode,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  TriangleAlert,
  Wand2,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const ACCENT = "var(--color-brand)";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: EASE },
  }),
};

function Reveal({ children, i = 0, className }: { children: ReactNode; i?: number; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      custom={i}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-4 ${className}`} style={{ paddingBlock: "clamp(72px, 10vw, 128px)" }}>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, title, sub, light }: { eyebrow: string; title: ReactNode; sub?: string; light?: boolean }) {
  return (
    <Reveal className="mb-12 max-w-[640px]">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: light ? "#D9C9FF" : ACCENT }}>
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.65rem, 4.2vw, 2.75rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p className="mt-5" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", lineHeight: 1.65, opacity: 0.8 }}>
          {sub}
        </p>
      )}
    </Reveal>
  );
}

function IconBadge({ icon: Icon, dark }: { icon: LucideIcon; dark?: boolean }) {
  return (
    <span
      className="grid h-11 w-11 place-items-center rounded-full"
      style={{ background: dark ? "rgba(255,255,255,0.12)" : ACCENT, color: "white" }}
    >
      <Icon size={20} />
    </span>
  );
}

function PillButton({ href, children, variant = "accent" }: { href: string; children: ReactNode; variant?: "accent" | "light" }) {
  return (
    <motion.div whileHover={{ scale: 1.04, filter: "brightness(1.1)" }} whileTap={{ scale: 0.96 }} className="inline-block">
      <Link
        href={href}
        className="flex items-center justify-between font-semibold"
        style={{
          background: variant === "accent" ? ACCENT : "var(--color-login-bg)",
          color: variant === "accent" ? "white" : "var(--color-text)",
          borderRadius: 50,
          padding: "17px 24px",
          fontSize: "clamp(0.9rem, 2vw, 1rem)",
          boxShadow: variant === "accent" ? "0 4px 24px rgba(74,29,150,0.35)" : "none",
          minWidth: 210,
          gap: 32,
        }}
      >
        {children}
        <ArrowRightCircle size={20} />
      </Link>
    </motion.div>
  );
}

const glass = "rounded-[28px] border border-white/70 bg-white/55 backdrop-blur-md";

/* ─────────────────────────── How It Works ─────────────────────────── */

const STEPS: [LucideIcon, string, string][] = [
  [Mic, "Type or dictate", "The doctor pastes or speaks the raw procedure notes into the Opero Doctor Portal."],
  [Wand2, "Gemini translates", "Jargon becomes gentle 6th-grade analogies, inside strict medical and visual safety rules."],
  [Box, "Scenes + voice, in parallel", "Calm 3D cards are composed while ElevenLabs narrates every step in the patient's language."],
  [QrCode, "Patient gets a link", "Sent by SMS or QR code. It opens instantly on any phone, with nothing to download."],
];

function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Heading
        eyebrow="How it works"
        title="From Dense Notes to a Calm Walkthrough in Seconds"
        sub="One input from the doctor. Four things happen at once. The patient gets something they actually understand."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([icon, title, body], i) => (
          <Reveal key={title} i={i} className={`${glass} flex flex-col gap-5 p-6`}>
            <div className="flex items-center justify-between">
              <IconBadge icon={icon} />
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", opacity: 0.12 }}>0{i + 1}</span>
            </div>
            <div>
              <h3 className="mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed opacity-75">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─────────────────────────────── Doctors ─────────────────────────────── */

const TRANSLATIONS = [
  ["Insufflation of the peritoneal cavity", "Filling your belly with a little air, like a balloon"],
  ["Four trocar ports placed", "Four small, clean openings"],
  ["Absorbable subcuticular sutures", "Stitches that dissolve on their own"],
  ["NPO after midnight", "Nothing to eat or drink after midnight"],
];

const DOCTOR_FEATURES: [LucideIcon, string][] = [
  [Columns2, "Dual-View split screen to demo the transformation live"],
  [Mic, "Dictate notes hands-free between patients"],
  [Clock, "Minutes back from every consent conversation"],
];

function Doctors() {
  return (
    <Section id="doctors">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Heading
            eyebrow="For doctors"
            title="Show the Transformation Right in the Consult Room"
            sub="Write the way you always do. Opero's Dual-View puts your clinical notes beside exactly what your patient will see, so you can explain it together."
          />
          <ul className="mb-10 space-y-4">
            {DOCTOR_FEATURES.map(([Icon, text], i) => (
              <Reveal key={text} i={i}>
                <li className="flex items-center gap-4 font-medium">
                  <IconBadge icon={Icon} />
                  {text}
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal i={3}>
            <PillButton href="/doctor">Open Doctor Portal</PillButton>
          </Reveal>
        </div>

        <Reveal i={1} className={`${glass} p-5 sm:p-7`}>
          <div className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
            <span>Your notes</span>
            <span>What they hear</span>
          </div>
          <div className="space-y-3">
            {TRANSLATIONS.map(([from, to], i) => (
              <motion.div
                key={from}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.5, ease: EASE }}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-white/80 p-4"
              >
                <span className="font-mono text-xs leading-snug line-through decoration-[#4A1D96]/40 opacity-60 sm:text-[13px]">{from}</span>
                <ArrowRightCircle size={18} style={{ color: ACCENT }} className="shrink-0" />
                <span className="text-sm font-semibold leading-snug" style={{ color: ACCENT }}>
                  “{to}”
                </span>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ────────────────────────────── Patients ────────────────────────────── */

const PATIENT_FEATURES: [LucideIcon, string, string][] = [
  [Smartphone, "Zero download", "One tap from a text message or a QR code."],
  [AudioLines, "A warm voice", "Each step is read aloud, gently, in their native language."],
  [SlidersHorizontal, "Anxiety Control", "Just the basics, a bit more, or the full picture. Their choice."],
  [MessageCircleQuestion, "Questions at 2 a.m.", "A chatbot that only answers from their doctor's instructions."],
];

const DEPTHS = ["Just the basics", "A bit more", "Full picture"];
const DEPTH_TEXT = [
  "Your doctor makes a little space so they can see clearly.",
  "Your belly is gently filled with a harmless gas, like a balloon, so your doctor has room to see and work.",
  "Your doctor gently fills your belly with carbon dioxide, a harmless gas. It lifts things up like a small balloon so there's room to see and work safely.",
];

function PhoneMock() {
  const [depth, setDepth] = useState(1);
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[44px] border-[9px] bg-[#FFF7FA] p-4 shadow-2xl" style={{ borderColor: "#192837" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
        Opero
      </p>
      <p className="mb-3 mt-1 leading-tight" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
        Hi Maria, here&apos;s your keyhole surgery
      </p>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-white p-1">
        {DEPTHS.map((d, i) => (
          <button
            key={d}
            onClick={() => setDepth(i)}
            className="rounded-full px-1 py-1.5 text-[11px] font-semibold transition-colors"
            style={depth === i ? { background: ACCENT, color: "white" } : { opacity: 0.6 }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl bg-white">
        <div className="relative grid h-40 place-items-center" style={{ background: "radial-gradient(circle at 50% 40%, #fff, #F4E6F7)" }}>
          <motion.span
            className="absolute h-16 w-16 rounded-full"
            style={{ background: "rgba(74,29,150,0.18)" }}
            animate={{ scale: [0.7, 1.15, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <Box size={40} style={{ color: ACCENT }} />
          <span className="absolute left-3 top-3 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium opacity-70">Step 3 of 8</span>
        </div>
        <div className="space-y-2 p-4">
          <p style={{ fontFamily: "var(--font-heading)" }}>A little room to see</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={depth}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs leading-relaxed opacity-80"
            >
              {DEPTH_TEXT[depth]}
            </motion.p>
          </AnimatePresence>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: "#EFE7FF", color: ACCENT }}>
            <AudioLines size={12} /> Listen
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        <p className="ml-auto w-fit rounded-2xl px-3 py-1.5 text-white" style={{ background: ACCENT }}>
          When can I shower?
        </p>
        <p className="w-fit max-w-[85%] rounded-2xl bg-white px-3 py-1.5">After 24 hours. No baths or swimming for 2 weeks.</p>
      </div>
    </div>
  );
}

function Patients() {
  return (
    <Section id="patients">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="order-2 lg:order-1">
          <PhoneMock />
          <p className="mt-4 text-center text-xs opacity-60">Try the toggle, it&apos;s live.</p>
        </Reveal>
        <div className="order-1 lg:order-2">
          <Heading
            eyebrow="For patients"
            title="Understand Your Procedure Before You Walk In"
            sub="No medical dictionary. No scary pictures. Just a calm, step-by-step story of what's going to happen, told the way a kind friend would."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {PATIENT_FEATURES.map(([icon, title, body], i) => (
              <Reveal key={title} i={i} className={`${glass} p-5`}>
                <IconBadge icon={icon} />
                <h3 className="mb-1.5 mt-4" style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed opacity-75">{body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────── Safety ─────────────────────────────── */

const FILTER_ROWS = [
  ["surgical incision", "a small, clean opening"],
  ["Veress needle", "a tiny tube"],
  ["insufflation of the peritoneal cavity", "filling your belly with a little air"],
  ["blood loss", "fluid"],
];

const SCENE_CHIPS = ["Sleep", "Inflate", "Camera", "Repair", "Close", "Monitor", "Home"];
const BLOCKED_CHIPS = ["Blood", "Needles", "Cuts", "Tissue"];

const darkCard = "relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-7";

function CardTitle({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12">
          <Icon size={18} />
        </span>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-white/75">{body}</p>
    </div>
  );
}

/** Live demo of the deterministic filter: each graphic phrase is struck through, then replaced. */
function FilterDemo() {
  return (
    <div className="rounded-[28px] border border-white/15 bg-[#1B0842]/60 p-5 shadow-[0_24px_60px_rgba(20,4,50,0.45)] backdrop-blur-md sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
          <motion.span
            className="h-2 w-2 rounded-full bg-[#7CF0B5]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          Safety filter · live
        </span>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">4 rewrites</span>
      </div>
      <ul className="space-y-3">
        {FILTER_ROWS.map(([from, to], i) => {
          const d = 0.3 + i * 0.45;
          return (
            <li key={from} className="rounded-2xl bg-white/[0.06] px-4 py-3">
              {/* Background-drawn strike line: follows the text across wrapped lines. */}
              <motion.span
                className="font-mono text-[13px] text-[#FFB8CC]"
                style={{
                  backgroundImage: "linear-gradient(#FFB8CC, #FFB8CC)",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 55%",
                }}
                initial={{ backgroundSize: "0% 1.5px" }}
                whileInView={{ backgroundSize: "100% 1.5px" }}
                viewport={{ once: true }}
                transition={{ delay: d, duration: 0.4, ease: EASE }}
              >
                {from}
              </motion.span>
              <motion.p
                className="mt-1.5 flex items-center gap-2 text-sm font-semibold"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: d + 0.35, duration: 0.45, ease: EASE }}
              >
                <ArrowRightCircle size={15} className="shrink-0 text-[#7CF0B5]" />“{to}”
              </motion.p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Safety() {
  return (
    <Section id="safety" className="text-white">
      <div
        className="relative overflow-hidden rounded-[36px] px-5 py-14 sm:px-12 sm:py-20"
        style={{ background: "linear-gradient(140deg, #1E0848 0%, #3A1580 45%, #4A1D96 75%, #6236B8 100%)" }}
      >
        {/* Ambient light + faint grid */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: "rgba(252,168,200,0.22)" }}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{ background: "rgba(140,100,255,0.35)" }}
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at 30% 20%, black 20%, transparent 75%)",
          }}
        />

        <div className="relative">
          <div className="mb-10 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E4D6FF]">
                <ShieldCheck size={14} /> Safety
              </p>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.9rem, 4.6vw, 3.25rem)", lineHeight: 1.02, letterSpacing: "-0.01em" }}>
                Calm Doesn&apos;t Mean
                <br />
                <span style={{ background: "linear-gradient(90deg, #FFD1E0, #C9B2FF)", WebkitBackgroundClip: "text", color: "transparent" }}>
                  Cutting Corners
                </span>
              </h2>
              <p className="mt-5 max-w-[480px] text-white/80" style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", lineHeight: 1.65 }}>
                A frightened patient only sees gentle things, and never misses what matters. Every safeguard runs
                automatically, on every walkthrough.
              </p>
              <div className="mt-8 grid max-w-[480px] grid-cols-3 gap-3">
                {[
                  ["0", "graphic images possible"],
                  ["2", "safety layers on every word"],
                  ["100%", "answers from the doctor"],
                ].map(([n, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem" }}>{n}</p>
                    <p className="text-xs leading-snug text-white/70">{label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal i={1}>
              <FilterDemo />
            </Reveal>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Reveal i={0} className={`${darkCard} lg:col-span-3`}>
              <CardTitle
                icon={Ban}
                title="Non-graphic by design"
                body="The AI never draws anything. It can only pick from a pre-built library of calm 3D scenes, and nothing graphic exists in that library."
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {SCENE_CHIPS.map((c) => (
                  <span key={c} className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium">
                    {c}
                  </span>
                ))}
                {BLOCKED_CHIPS.map((c) => (
                  <span key={c} className="rounded-full border border-dashed border-white/25 px-3 py-1.5 text-xs text-white/40 line-through">
                    {c}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal i={1} className={`${darkCard} lg:col-span-2`}>
              <CardTitle icon={ShieldCheck} title="Two layers of language safety" body="Strict Gemini rules first, then a deterministic filter that catches anything that slips through." />
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold">
                {["Gemini rules", "Filter", "Patient"].map((s, i) => (
                  <div key={s} className="flex flex-1 items-center gap-2">
                    <span className={`flex-1 rounded-xl px-2 py-2 text-center ${i === 2 ? "bg-white text-[#4A1D96]" : "bg-white/12"}`}>{s}</span>
                    {i < 2 && <ArrowRightCircle size={14} className="shrink-0 text-white/50" />}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal i={2} className={`${darkCard} lg:col-span-2`}>
              <CardTitle icon={TriangleAlert} title="Warning signs stay plain" body="Explanations are softened. Warning signs never are, so patients always know when to get help." />
              <div className="mt-6 rounded-2xl border border-[#FFB8CC]/30 bg-[#FFB8CC]/10 p-4 text-sm">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFB8CC]">Call your doctor if</p>
                <p>Bleeding won&apos;t stop, or you have a fever over 101°F.</p>
              </div>
            </Reveal>

            <Reveal i={3} className={`${darkCard} lg:col-span-3`}>
              <CardTitle
                icon={BookCheck}
                title="Grounded in the doctor's words"
                body="The Q&A only answers from the doctor's own instructions. When something isn't covered, it says so instead of guessing."
              />
              <div className="mt-6 space-y-2 text-sm">
                <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-white px-4 py-2 text-[#192837]">Can I have a glass of wine this week?</p>
                <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-white/12 px-4 py-2">
                  Dr. Rivera didn&apos;t cover that in your instructions. Please ask your care team. They&apos;ll be happy to help.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ──────────────────────────── Conversation ──────────────────────────── */

const CONVERSATION: Message[] = [
  { text: "Hi Maria, I've sent you a short walkthrough of tomorrow's surgery. No scary pictures, promise.", sender: "them", timestamp: "6:02 PM" },
  { text: "Thank you. I've been so nervous. I didn't understand half the consent form 😟", sender: "me" },
  { text: "Totally normal. Tap the link. It explains every step simply, and you can listen in Spanish too.", sender: "them" },
  { text: "Just watched it. The balloon part finally makes sense! Can I shower after?", sender: "me", timestamp: "6:11 PM" },
  { text: "Yes, after 24 hours. It's all in your care checklist 💜", sender: "them" },
];

function Conversation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [run, setRun] = useState(0);

  return (
    <Section id="conversation">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <Heading
            eyebrow="The difference"
            title="From Worried to Ready in One Conversation"
            sub="The night before surgery is when fear peaks. With Opero, patients get answers in words they understand, and doctors spend minutes, not an hour, getting them there."
          />
          <div className="grid max-w-[480px] grid-cols-2 gap-3">
            {[
              ["1 link", "replaces a stack of printouts"],
              ["24/7", "answers from the doctor's own notes"],
            ].map(([n, label], i) => (
              <Reveal key={label} i={i} className={`${glass} p-5`}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: ACCENT }}>{n}</p>
                <p className="mt-1 text-sm opacity-70">{label}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal i={1}>
          <div ref={ref} className={`${glass} mx-auto w-full max-w-[460px] overflow-hidden !bg-white/70 shadow-[0_24px_60px_rgba(74,29,150,0.12)]`}>
            <div className="flex items-center gap-3 border-b border-[#192837]/8 px-5 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: ACCENT }}>
                DR
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Dr. Rivera</p>
                <p className="flex items-center gap-1.5 text-xs opacity-60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" /> General Surgery
                </p>
              </div>
              <button
                onClick={() => setRun((r) => r + 1)}
                className="flex items-center gap-1.5 rounded-full border border-[#192837]/10 px-3 py-1.5 text-xs font-medium transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                aria-label="Replay conversation"
              >
                <RotateCcw size={13} /> Replay
              </button>
            </div>
            <div>
              <IOSMessageList
                  key={run}
                  play={inView}
                  messages={CONVERSATION}
                  font={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: "1.4em" }}
                  sentBubbleColor="#4A1D96"
                  receivedBubbleColor="#FFFFFF"
                  receivedTextColor="#192837"
                  timestampColor="rgba(25,40,55,0.45)"
                  typingSender="me"
                  staggerDelay={650}
                  style={{ padding: 20, gap: 10, overflowY: "visible", height: "auto" }}
                />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ──────────────────────────────── Help ──────────────────────────────── */

const FAQ = [
  ["Does my patient need to download an app?", "No. They get a link by SMS or scan a QR code, and it opens in their phone's browser."],
  ["Which languages are supported?", "16 languages today, including Spanish, Hindi, Mandarin, Arabic, Bengali, Tagalog and Tamil, with both text and voice in the patient's language."],
  ["Can the chatbot give medical advice?", "No. It only answers from the doctor's own notes and instructions. If something isn't covered, it tells the patient to ask their care team, and it flags emergencies straight away."],
  ["Will the visuals ever show anything graphic?", "No. The AI can only choose from a fixed library of calm, stylised 3D scenes. There is no way for it to draw blood, cuts or needles."],
  ["What is the Anxiety Control toggle?", "Every step is written at three depths. The doctor picks a starting level, and the patient can switch anytime to see less or more."],
];

function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="help">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <Heading eyebrow="Help" title="Questions, Answered Calmly" sub="Everything you need to know before your first walkthrough." />
        <div className="space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} i={i} className={`${glass} overflow-hidden`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold"
                aria-expanded={open === i}
              >
                {q}
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }} className="shrink-0" style={{ color: ACCENT }}>
                  <Plus size={20} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed opacity-75">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal className={`${glass} mt-24 flex flex-col items-start justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-center`}>
        <div className="max-w-[560px]">
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)", lineHeight: 1.08 }}>
            Give your next patient a calmer surgery day.
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm opacity-70">
            <Globe size={16} /> 16 languages · free to try · no download for patients
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PillButton href="/signup">Try It Free</PillButton>
        </div>
      </Reveal>

    </Section>
  );
}

export default function Sections() {
  return (
    <>
      <HowItWorks />
      <Doctors />
      <Patients />
      <Safety />
      <Conversation />
      <Help />
    </>
  );
}
