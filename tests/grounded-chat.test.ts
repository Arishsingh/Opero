import { describe, expect, it } from "vitest";
import { DEMO_PLAN, demoAnswer } from "@/lib/demo";
import type { Session } from "@/lib/types";

const session: Session = {
  id: "test123456",
  createdAt: new Date().toISOString(),
  patientName: "Maria",
  doctorName: "Dr. Rivera",
  language: "English",
  defaultDepth: "standard",
  notes: "",
  plan: DEMO_PLAN,
  safety: { passed: true, replaced: [] },
  demo: true,
};

describe("offline grounded Q&A", () => {
  it("answers from the doctor's instructions", () => {
    expect(demoAnswer(session, "When can I shower?")).toMatch(/shower after 24 hours/i);
  });

  it("lists warning signs when asked what to watch for", () => {
    const answer = demoAnswer(session, "What should I watch out for?");
    expect(answer).toMatch(/Call Dr\. Rivera/);
    expect(answer).toMatch(/fever/i);
  });

  it("says so instead of guessing when the notes don't cover it", () => {
    expect(demoAnswer(session, "Can I drink wine next week?")).toMatch(/didn't cover that/);
  });

  it("escalates emergencies", () => {
    expect(demoAnswer(session, "I have chest pain and can't breathe")).toMatch(/emergency/i);
  });
});
