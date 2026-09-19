import { describe, expect, it } from "vitest";
import { enforceSafety } from "@/lib/safety";
import { DEMO_PLAN } from "@/lib/demo";
import type { Plan } from "@/lib/types";

const L = (t: string) => ({ calm: t, standard: t, detailed: t });

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    procedureName: "Test procedure",
    summary: L("A calm summary."),
    steps: [{ title: "Step", scene: "welcome", region: "whole-body", text: L("Text."), narration: L("Narration.") }],
    glossary: [],
    instructions: { before: [], after: [], callDoctorIf: [] },
    ...overrides,
  };
}

describe("enforceSafety", () => {
  it("rewrites graphic terms in patient-facing text", () => {
    const { plan: out } = enforceSafety(
      plan({
        summary: L("We make a surgical incision and use a needle. Minimal blood loss."),
        steps: [
          {
            title: "Insufflation",
            scene: "inflate",
            region: "lower-abdomen",
            text: L("Insufflation of the peritoneal cavity, then we cut into the tissue."),
            narration: L("The scalpel is used."),
          },
        ],
      })
    );
    const all = JSON.stringify([out.summary, out.steps]).toLowerCase();
    for (const banned of ["incision", "needle", "blood", "insufflat", "peritoneal", "cut into", "scalpel"]) {
      expect(all).not.toContain(banned);
    }
    expect(out.summary.calm).toContain("small, clean opening");
    expect(out.steps[0].narration.calm).toContain("special tool");
  });

  it("never softens warning signs", () => {
    const { plan: out } = enforceSafety(
      plan({ instructions: { before: [], after: ["Keep the wound dry"], callDoctorIf: ["Bleeding that won't stop"] } })
    );
    expect(out.instructions.callDoctorIf).toEqual(["Bleeding that won't stop"]);
    expect(out.instructions.after).toEqual(["Keep the healing spot dry"]);
  });

  it("leaves the doctor-facing glossary untouched", () => {
    const glossary = [{ term: "Veress needle", friendly: "a tiny tube" }];
    expect(enforceSafety(plan({ glossary })).plan.glossary).toEqual(glossary);
  });

  it("reports what it replaced", () => {
    const { report } = enforceSafety(plan({ summary: L("One incision.") }));
    expect(report.passed).toBe(true);
    expect(report.replaced.map((r) => r.from)).toContain("incision");
  });

  it("does not change already-safe text", () => {
    const { plan: out, report } = enforceSafety(DEMO_PLAN);
    expect(report.replaced).toEqual([]);
    expect(out.steps).toEqual(DEMO_PLAN.steps);
  });

  it("keeps everyday uses of the word blood", () => {
    const { plan: out } = enforceSafety(plan({ summary: L("Sugar builds up in your blood.") }));
    expect(out.summary.calm).toBe("Sugar builds up in your blood.");
  });

  it("softens talk of losing blood", () => {
    const { plan: out } = enforceSafety(plan({ summary: L("You may lose a little blood.") }));
    expect(out.summary.calm).toBe("You may lose some fluid.");
  });

  it("keeps everyday phrases like blood sugar and blood pressure", () => {
    const { plan: out } = enforceSafety(plan({ summary: L("We will check your blood sugar and blood pressure with a blood test.") }));
    expect(out.summary.calm).toBe("We will check your blood sugar and blood pressure with a blood test.");
  });

  it("does not mangle words that merely start with 'stab'", () => {
    const { plan: out, report } = enforceSafety(plan({ summary: L("Your knee is stable and we will stabilize it.") }));
    expect(out.summary.calm).toBe("Your knee is stable and we will stabilize it.");
    expect(report.replaced).toEqual([]);
  });

  it("rewrites the new condition and approach sections too", () => {
    const { plan: out } = enforceSafety(
      plan({
        condition: { name: "Gallstones", explanation: L("A needle is not needed.") },
        approach: { whyThisPlan: ["No incision is large."], otherOptions: [{ name: "Wait", note: "No scalpel." }], outlook: "Minimal blood loss." },
      })
    );
    expect(out.condition?.explanation.calm).not.toMatch(/needle/i);
    expect(out.approach?.whyThisPlan[0]).not.toMatch(/incision/i);
    expect(out.approach?.otherOptions[0].note).not.toMatch(/scalpel/i);
    expect(out.approach?.outlook).not.toMatch(/blood/i);
  });
});
