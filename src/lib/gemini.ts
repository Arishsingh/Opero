import { GoogleGenAI, ThinkingLevel, type ThinkingConfig } from "@google/genai";
import { REGIONS, SCENES, type Plan, type Session } from "./types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
// Used automatically if the main model is overloaded (503) or rate-limited (429).
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.1-flash-lite";

export const hasGemini = () => Boolean(process.env.GEMINI_API_KEY);

/**
 * Keep "thinking" low: these tasks are structured rewriting, not reasoning, and a
 * full thinking pass made a walkthrough take ~2 minutes instead of seconds.
 */
function thinking(model: string): ThinkingConfig | undefined {
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-3/.test(model)) return { thinkingLevel: ThinkingLevel.LOW }; // not every 3.x model accepts MINIMAL
  return undefined;
}

/** Runs a Gemini call on the main model, retrying once on the fallback model if Google is overloaded. */
async function withFallback<T>(run: (model: string) => Promise<T>): Promise<T> {
  try {
    return await run(MODEL);
  } catch (err) {
    const status = (err as { status?: number }).status;
    const overloaded = status === 503 || status === 429 || /high demand|overloaded|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(String(err));
    if (!overloaded || FALLBACK_MODEL === MODEL) throw err;
    console.warn(`Gemini ${MODEL} unavailable (${status ?? "overloaded"}), retrying with ${FALLBACK_MODEL}`);
    return run(FALLBACK_MODEL);
  }
}

function client() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

const PLAN_SYSTEM = `You are Opero, a clinical communication engine. Doctors write in clinical shorthand (abbreviations like "Pt", "R knee", "NPO", "s/p", "PRN", "b.i.d.", Latin terms, lab values). You understand it fully and turn it into a calm, kind explanation for the patient: what is happening in their body, what the plan is and why, and how to look after themselves. The notes may describe surgery, a procedure, a new diagnosis, or a medication/treatment plan.

HARD RULES — never break these:
1. Faithfulness: Only describe what is in the doctor's notes. Never invent steps, risks, drugs, numbers or instructions. If the notes are silent on something, leave it out.
2. Reading level: 6th grade. Short sentences. Warm, calm, second person ("you"). Use gentle everyday analogies (e.g. "surgical incision" -> "a small, clean opening"; "insufflation of the peritoneal cavity" -> "filling your belly with a little air, like a balloon, so the doctor has room to see").
3. Non-graphic: In steps and summaries NEVER mention blood, cutting, slicing, needles, scalpels, wounds, tissue damage, pain intensity, or death. Describe outcomes and care, not mechanics. Exception: "callDoctorIf" warning signs must stay medically accurate and plain (e.g. "bleeding that won't stop") so the patient knows when to get help.
4. Language: Write every patient-facing string in {LANGUAGE}. The glossary "friendly" field stays in English (it is shown to the doctor).
5. Visuals: For each step choose exactly one "scene" from: ${SCENES.join(", ")} and one "region" from: ${REGIONS.join(", ")}. Scenes are pre-built, non-graphic 3D animations:
   welcome=intro/overview, sleep=anesthesia or sedation, entry=small openings/ports, inflate=gas or fluid to make space, camera=scope/camera/imaging, repair=fixing or treating, remove=taking something out, close=closing openings, monitor=vitals/observation/recovery room, recovery=healing, home=discharge and home care.
6. Anxiety depth: every text has 3 versions:
   calm = 1 short reassuring sentence, no mechanics at all.
   standard = 2-3 sentences, clear everyday detail.
   detailed = 3-5 sentences, fuller explanation for patients who want to know everything (still non-graphic).
   "narration" is the voiceover for that step: spoken, warm, flowing, slightly longer than the text, no lists or symbols.
7. Steps: 4 to 8 steps in chronological order, starting with a "welcome" step that gently explains what is happening in the body and ending with "recovery" or "home". For a diagnosis or medication plan, the steps walk through understanding the condition, the treatment, daily care and follow-up.
8. Glossary: list every piece of medical jargon from the notes (exact phrase as written in the notes) with a friendly English analogy.
9. Instructions: extract ONLY explicit instructions from the notes: before (prep), after (care), callDoctorIf (warning signs). Rewrite them plainly. Empty arrays if none.
10. Condition ("What's happening in your body"): explain the diagnosis or reason for care gently, like a kind friend who is a doctor. Name it plainly, say what it means in everyday words, and never blame the patient. No frightening words ("tumor", "failure", "malignant", "serious", "dangerous") unless the doctor wrote them, and if so soften the framing without hiding the fact. If the notes give no diagnosis, describe the reason for the visit.
11. Approach ("Why this plan is right for you"):
   whyThisPlan = the reasons for this treatment that the notes state or clearly imply (e.g. "recurrent pain", "keyhole surgery means faster recovery"). NEVER invent reasons, statistics or success rates. Empty array if the notes give none.
   otherOptions = only alternatives the notes mention, each with a short gentle note. Empty array if none.
   outlook = one hopeful, honest sentence about what the plan aims to achieve, based only on the notes. Any timeframe or number must be copied exactly from the notes (if the notes say "sport 4-6 wks", say "4 to 6 weeks", never "a few months") (e.g. "Most people go home the same day and feel better within a couple of weeks" only if the notes say so). If the notes say nothing, write a warm sentence that the care team will guide them, with no medical claims.
12. Tone everywhere: gentle, reassuring and respectful. Never harsh, never alarming, never talking down.`;

const layered = {
  type: "object",
  properties: {
    calm: { type: "string" },
    standard: { type: "string" },
    detailed: { type: "string" },
  },
  required: ["calm", "standard", "detailed"],
};

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    procedureName: { type: "string", description: "Friendly name of the procedure or plan in the patient's language" },
    summary: layered,
    condition: {
      type: "object",
      description: "What's happening in the patient's body, explained kindly",
      properties: { name: { type: "string" }, explanation: layered },
      required: ["name", "explanation"],
    },
    approach: {
      type: "object",
      description: "Why this plan was chosen — only from the notes",
      properties: {
        whyThisPlan: { type: "array", items: { type: "string" } },
        otherOptions: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, note: { type: "string" } }, required: ["name", "note"] },
        },
        outlook: { type: "string" },
      },
      required: ["whyThisPlan", "otherOptions", "outlook"],
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          scene: { type: "string", enum: [...SCENES] },
          region: { type: "string", enum: [...REGIONS] },
          text: layered,
          narration: layered,
        },
        required: ["title", "scene", "region", "text", "narration"],
      },
    },
    glossary: {
      type: "array",
      items: {
        type: "object",
        properties: { term: { type: "string" }, friendly: { type: "string" } },
        required: ["term", "friendly"],
      },
    },
    instructions: {
      type: "object",
      properties: {
        before: { type: "array", items: { type: "string" } },
        after: { type: "array", items: { type: "string" } },
        callDoctorIf: { type: "array", items: { type: "string" } },
      },
      required: ["before", "after", "callDoctorIf"],
    },
  },
  required: ["procedureName", "summary", "condition", "approach", "steps", "glossary", "instructions"],
};

export async function generatePlan(input: {
  notes: string;
  language: string;
  patientName: string;
}): Promise<Plan> {
  const res = await withFallback((model) => client().models.generateContent({
    model,
    contents: `Patient first name: ${input.patientName || "the patient"}\n\nDOCTOR'S NOTES:\n"""\n${input.notes}\n"""`,
    config: {
      systemInstruction: PLAN_SYSTEM.replace("{LANGUAGE}", input.language),
      responseMimeType: "application/json",
      responseJsonSchema: PLAN_SCHEMA,
      temperature: 0.4,
      thinkingConfig: thinking(model),
    },
  }));
  const plan = JSON.parse(res.text ?? "{}") as Plan;
  if (!plan.steps?.length) throw new Error("Gemini returned an empty plan");
  // Belt and braces: clamp any value outside the safe visual library.
  plan.steps = plan.steps.map((s) => ({
    ...s,
    scene: SCENES.includes(s.scene) ? s.scene : "welcome",
    region: REGIONS.includes(s.region) ? s.region : "whole-body",
  }));
  return plan;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

function chatSystem(session: Session) {
  const { plan } = session;
  return `You are the Opero care assistant for ${session.patientName || "a patient"}. You answer questions after their consultation with ${session.doctorName}.

GROUNDING — the ONLY facts you may use are in the SOURCE below. Do not use general medical knowledge to add facts, doses, timelines or advice.
- If the answer is in the SOURCE: answer in 1-3 short, warm sentences at a 6th-grade level.
- If it is NOT in the SOURCE: say kindly that ${session.doctorName} didn't cover that in your instructions and suggest asking the care team. Do not guess.
- If the patient describes a possible emergency (trouble breathing, chest pain, heavy bleeding, fainting, high fever, severe pain), tell them to call emergency services or their care team right away.
- Explanations must be non-graphic (no needles, cutting, or gore). Warning signs are the exception: state them plainly and directly so the patient knows when to get help.
- Reply in ${session.language}.

SOURCE — DOCTOR'S ORIGINAL NOTES:
"""
${session.notes}
"""

SOURCE — APPROVED EXPLANATION:
Condition: ${plan.condition ? `${plan.condition.name}. ${plan.condition.explanation.detailed}` : "not stated"}
Why this plan: ${plan.approach?.whyThisPlan.join(" | ") || "not stated"}
Other options mentioned: ${plan.approach?.otherOptions.map((o) => `${o.name}: ${o.note}`).join(" | ") || "none"}

SOURCE — APPROVED PATIENT INSTRUCTIONS:
Before: ${plan.instructions.before.join(" | ") || "none given"}
After: ${plan.instructions.after.join(" | ") || "none given"}
Call the doctor if: ${plan.instructions.callDoctorIf.join(" | ") || "none given"}`;
}

export async function answerQuestion(session: Session, messages: ChatMessage[]) {
  const res = await withFallback((model) => client().models.generateContent({
    model,
    contents: messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: { systemInstruction: chatSystem(session), temperature: 0.2, thinkingConfig: thinking(model) },
  }));
  return res.text?.trim() || "I'm sorry, I couldn't answer that. Please ask your care team.";
}
