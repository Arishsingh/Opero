import type { Plan, SafetyReport } from "./types";

// Deterministic second line of defence behind the Gemini system prompt.
// Anything graphic that slips through the model is rewritten before a patient sees it.
const RULES: [RegExp, string][] = [
  [/\binsufflation of the (peritoneal cavity|abdomen)\b/gi, "gently filling the belly with air"],
  [/\bsurgical incisions?\b/gi, "small, clean opening"],
  [/\bincisions?\b/gi, "small opening"],
  [/\bscalpels?\b/gi, "special tool"],
  [/\bneedles?\b/gi, "tiny tube"],
  [/\binjections?\b/gi, "medicine"],
  [/\bsyringes?\b/gi, "medicine dispenser"],
  [/\bbleeding\b/gi, "a little oozing"],
  [/\bblood loss\b/gi, "fluid"],
  [/\bbloody\b/gi, ""],
  // "Blood" on its own is everyday language ("blood sugar", "sugar in your blood"); only graphic phrasing is rewritten.
  [/\b(lose|lost|losing|loses)\s+(some\s+|a little\s+|a lot of\s+)?blood\b/gi, "lose some fluid"],
  [/\bcut(s|ting)? (open|into|through)\b/gi, "make a small opening in"],
  [/\bslic(e|es|ing|ed)\b/gi, "open"],
  [/\bstab(s|bed|bing)?\b/gi, "place"], // not "stable" or "stabilize"
  [/\bpuncture[sd]?\b/gi, "small opening"],
  [/\bexcis(e|ed|es|ion)\b/gi, "remove"],
  [/\bresect(ed|ion|s)?\b/gi, "remove"],
  [/\bcauteriz\w*\b/gi, "seal"],
  [/\bgore\b/gi, ""],
  [/\bwounds?\b/gi, "healing spot"],
  [/\bflesh\b/gi, "body"],
  [/\bperitoneal cavity\b/gi, "belly space"],
  [/\binsufflat\w*\b/gi, "gently filling with air"],
  [/\bdeath\b|\bdie\b|\bdying\b|\bfatal\b/gi, "serious problem"],
];

function scrub(text: string, counts: Map<string, { to: string; count: number }>) {
  let out = text;
  for (const [pattern, replacement] of RULES) {
    out = out.replace(pattern, (match) => {
      const key = match.toLowerCase();
      const entry = counts.get(key) ?? { to: replacement, count: 0 };
      entry.count++;
      counts.set(key, entry);
      return replacement;
    });
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

/**
 * Scrubs every patient-facing explanation in the plan. Left intact on purpose:
 * - the glossary (doctor-facing)
 * - "call your doctor if" warning signs — softening "bleeding" there could delay care.
 */
export function enforceSafety(plan: Plan): { plan: Plan; report: SafetyReport } {
  const counts = new Map<string, { to: string; count: number }>();
  const s = (t: string) => scrub(t, counts);
  const layered = (l: Plan["summary"]) => ({
    calm: s(l.calm),
    standard: s(l.standard),
    detailed: s(l.detailed),
  });

  const safe: Plan = {
    ...plan,
    procedureName: s(plan.procedureName),
    summary: layered(plan.summary),
    ...(plan.condition && { condition: { name: s(plan.condition.name), explanation: layered(plan.condition.explanation) } }),
    ...(plan.approach && {
      approach: {
        whyThisPlan: plan.approach.whyThisPlan.map(s),
        otherOptions: plan.approach.otherOptions.map((o) => ({ name: s(o.name), note: s(o.note) })),
        outlook: s(plan.approach.outlook),
      },
    }),
    steps: plan.steps.map((step) => ({
      ...step,
      title: s(step.title),
      text: layered(step.text),
      narration: layered(step.narration),
    })),
    instructions: {
      before: plan.instructions.before.map(s),
      after: plan.instructions.after.map(s),
      callDoctorIf: plan.instructions.callDoctorIf,
    },
  };

  const replaced = [...counts.entries()].map(([from, v]) => ({ from, to: v.to, count: v.count }));
  return { plan: safe, report: { passed: true, replaced } };
}
