"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDictation } from "@/lib/useDictation";
import PatientView from "@/components/PatientView";
import SharePanel from "@/components/SharePanel";
import { SAMPLE_NOTES } from "@/lib/demo";
import { DEPTHS, DEPTH_LABELS, LANGUAGES, type Depth, type GlossaryItem, type Session } from "@/lib/types";

const STAGES = [
  "Reading clinical notes",
  "Translating jargon to 6th-grade language",
  "Enforcing visual safety boundaries",
  "Composing 3D scenes",
];

type VoiceState = { done: number; total: number; mode: "elevenlabs" | "browser" | "pending" };

export default function DoctorPortal({ userEmail }: { userEmail?: string }) {
  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Rivera");
  const [language, setLanguage] = useState("English");
  const [depth, setDepth] = useState<Depth>("standard");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [editing, setEditing] = useState(true);
  const [voice, setVoice] = useState<VoiceState | null>(null);
  const dictation = useDictation((text) => setNotes((n) => (n ? `${n} ${text}` : text)));

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1600);
    return () => clearInterval(t);
  }, [loading]);

  async function generate() {
    setLoading(true);
    setStage(0);
    setError(null);
    setVoice(null);
    dictation.stop();
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, patientName, doctorName, language, depth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSession(data);
      setEditing(false);
      warmVoices(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Parallel voice pipeline: synthesize every step's narration at once so playback is instant.
  // Voice pipeline: prepare each step's narration one at a time (the voice API is rate-limited),
  // stopping at the first failure — the player then falls back to the device voice.
  async function warmVoices(s: Session) {
    const total = s.plan.steps.length;
    setVoice({ done: 0, total, mode: "pending" });
    for (let i = 0; i < total; i++) {
      const res = await fetch(`/api/tts?id=${s.id}&step=${i}&depth=${s.defaultDepth}`).catch(() => null);
      if (!res?.ok) {
        setVoice({ done: total, total, mode: "browser" });
        return;
      }
      await res.arrayBuffer();
      setVoice((v) => (v ? { ...v, done: i + 1 } : v));
    }
    setVoice({ done: total, total, mode: "elevenlabs" });
  }

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-line bg-paper/70 px-6 py-3 backdrop-blur">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold">Opero</span>
          <span className="text-xs text-subtle">Doctor Portal</span>
        </Link>
        <div className="flex items-center gap-3">
          {session && (
            <button
              onClick={() => {
                setSession(null);
                setEditing(true);
                setVoice(null);
              }}
              className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-teal"
            >
              + New patient
            </button>
          )}
          {userEmail && (
            <div className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold uppercase text-white"
                style={{ background: "var(--color-brand)" }}
                aria-hidden
              >
                {userEmail[0]}
              </span>
              <span className="hidden max-w-[220px] truncate text-sm text-subtle sm:inline">{userEmail}</span>
              <form action="/api/signout" method="post">
                <button className="rounded-full px-3 py-1.5 text-sm text-subtle transition hover:bg-cream hover:text-ink">Sign out</button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_400px] lg:px-6">
        {/* LEFT — the doctor's world */}
        <section className="min-w-0 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Clinical notes</p>
              <h1 className="font-serif text-2xl">{session ? "What you wrote" : "Type or dictate the procedure notes"}</h1>
            </div>
            {session && !editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-teal hover:underline">
                Edit notes
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 rounded-2xl border border-line bg-paper p-4">
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Elective laparoscopic cholecystectomy under GA. Insufflation of the peritoneal cavity with CO2…"
                  className="h-64 w-full resize-y rounded-xl border border-line bg-cream p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-teal"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button onClick={() => setNotes(SAMPLE_NOTES)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs hover:border-teal">
                    Use sample
                  </button>
                  {dictation.supported && (
                    <button
                      onClick={dictation.listening ? dictation.stop : dictation.start}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${dictation.listening ? "animate-pulse bg-rose text-white" : "bg-ink text-white"}`}
                    >
                      {dictation.listening ? "● Stop dictating" : "🎙 Dictate"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Patient first name">
                  <input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Maria" className="input" />
                </Field>
                <Field label="Your name">
                  <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="input" />
                </Field>
                <Field label="Patient's language">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-subtle">Anxiety Control — starting detail level (patient can change it)</span>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-cream p-1">
                  {DEPTHS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      className={`rounded-lg px-2 py-2 text-left transition ${depth === d ? "bg-paper shadow-sm ring-1 ring-teal" : "hover:bg-paper/60"}`}
                    >
                      <span className="block text-sm font-medium">{DEPTH_LABELS[d].label}</span>
                      <span className="block text-xs text-subtle">{DEPTH_LABELS[d].hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="rounded-lg bg-peach-soft px-3 py-2 text-sm text-rose">{error}</p>}

              <button
                onClick={generate}
                disabled={loading || notes.trim().length < 20}
                className="w-full rounded-xl bg-teal py-3 font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-40"
              >
                {loading ? STAGES[stage] + "…" : "Transform for patient →"}
              </button>
            </div>
          ) : (
            session && <HighlightedNotes notes={session.notes} glossary={session.plan.glossary} />
          )}

          {session && !editing && (
            <>
              <SharePanel session={session} />
              <PipelineStatus session={session} voice={voice} />
              <GlossaryTable glossary={session.plan.glossary} />
            </>
          )}
        </section>

        {/* RIGHT — what the patient sees */}
        <section className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-subtle">What your patient sees</p>
          <div className="relative mx-auto h-[720px] w-full max-w-[380px] overflow-hidden rounded-[44px] border-[10px] border-ink bg-cream shadow-2xl">
            {session ? (
              <PatientView key={session.id} session={session} embedded />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                {loading ? (
                  <ul className="w-full space-y-3 text-left text-sm">
                    {STAGES.map((s, i) => (
                      <li key={s} className={`flex items-center gap-3 transition ${i <= stage ? "opacity-100" : "opacity-30"}`}>
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${i < stage ? "bg-teal text-white" : i === stage ? "animate-pulse bg-teal-soft" : "bg-line"}`}>
                          {i < stage ? "✓" : ""}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <div className="text-4xl">🫶</div>
                    <p className="font-serif text-lg">Your patient&apos;s calm, visual walkthrough will appear here.</p>
                    <p className="text-sm text-subtle">Paste notes or tap “Use sample” to see the transformation.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-subtle">{label}</span>
      {children}
    </label>
  );
}

function HighlightedNotes({ notes, glossary }: { notes: string; glossary: GlossaryItem[] }) {
  const parts = useMemo(() => {
    const terms = glossary.map((g) => g.term).filter(Boolean).sort((a, b) => b.length - a.length);
    if (!terms.length) return [notes];
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return notes.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  }, [notes, glossary]);
  const lookup = new Map(glossary.map((g) => [g.term.toLowerCase(), g.friendly]));

  return (
    <div className="whitespace-pre-wrap rounded-2xl border border-line bg-paper p-5 font-mono text-[13px] leading-7">
      {parts.map((p, i) => {
        const friendly = lookup.get(p.toLowerCase());
        return friendly ? (
          <span key={i} className="jargon" title={`→ ${friendly}`}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </div>
  );
}

function GlossaryTable({ glossary }: { glossary: GlossaryItem[] }) {
  if (!glossary.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="mb-3 text-sm font-semibold">Jargon → what your patient hears</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {glossary.map((g) => (
          <div key={g.term} className="rounded-xl bg-cream px-3 py-2 text-sm">
            <span className="text-subtle line-through decoration-peach/70">{g.term}</span>
            <span className="block font-medium text-teal">“{g.friendly}”</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineStatus({ session, voice }: { session: Session; voice: VoiceState | null }) {
  const rows: [string, string, boolean][] = [
    ["Language", `${session.language} · 6th-grade reading level`, true],
    [
      "Visual safety",
      session.safety.replaced.length
        ? `Passed — auto-rewrote ${session.safety.replaced.map((r) => `“${r.from}”`).join(", ")}`
        : "Passed — no graphic terms in output",
      true,
    ],
    ["3D scenes", `${session.plan.steps.length} non-graphic scenes composed`, true],
    [
      "Voice",
      !voice || voice.mode === "pending"
        ? `Synthesizing ${voice?.done ?? 0}/${voice?.total ?? session.plan.steps.length} clips in parallel…`
        : voice.mode === "elevenlabs"
          ? `${voice.total} natural voice narrations ready`
          : "Using device voice (natural voice unavailable or rate-limited)",
      voice?.mode !== "pending",
    ],
  ];
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="mb-3 text-sm font-semibold">
        Pipeline {session.demo && <span className="ml-2 rounded-full bg-peach-soft px-2 py-0.5 text-xs font-medium text-rose">Demo mode — add GEMINI_API_KEY</span>}
      </p>
      <ul className="space-y-2 text-sm">
        {rows.map(([k, v, ok]) => (
          <li key={k} className="flex gap-3">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${ok ? "bg-teal text-white" : "animate-pulse bg-teal-soft"}`}>
              {ok ? "✓" : ""}
            </span>
            <span>
              <span className="font-medium">{k}:</span> <span className="text-subtle">{v}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
