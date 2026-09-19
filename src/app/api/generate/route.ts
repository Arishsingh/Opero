import { NextResponse } from "next/server";
import { generatePlan, hasGemini } from "@/lib/gemini";
import { enforceSafety } from "@/lib/safety";
import { newId, saveSession } from "@/lib/store";
import { DEMO_PLAN } from "@/lib/demo";
import { getCurrentUser } from "@/lib/session";
import { ALL_OUTPUTS, DEPTHS, type Depth, type Outputs, type Session } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const notes = String(body?.notes ?? "").trim();
  if (notes.length < 20) {
    return NextResponse.json({ error: "Please enter the procedure notes (at least a few sentences)." }, { status: 400 });
  }
  if (notes.length > 20_000) {
    return NextResponse.json({ error: "Notes are too long (max 20,000 characters)." }, { status: 400 });
  }

  const language = String(body?.language || "English").slice(0, 40);
  const patientName = String(body?.patientName || "").slice(0, 60);
  const doctorName = String(body?.doctorName || "Your doctor").slice(0, 60);
  const defaultDepth: Depth = DEPTHS.includes(body?.depth) ? body.depth : "standard";
  const requested = body?.outputs as Partial<Outputs> | undefined;
  const outputs: Outputs = requested
    ? { video: requested.video !== false, images: requested.images !== false, report: requested.report !== false }
    : ALL_OUTPUTS;
  if (!outputs.video && !outputs.images && !outputs.report) {
    return NextResponse.json({ error: "Choose at least one: video, images or report." }, { status: 400 });
  }

  const demo = !hasGemini();
  let rawPlan;
  try {
    rawPlan = demo ? DEMO_PLAN : await generatePlan({ notes, language, patientName });
  } catch (err) {
    console.error("generatePlan failed", err);
    return NextResponse.json({ error: "The AI engine couldn't process these notes. Please try again." }, { status: 502 });
  }

  const { plan, report } = enforceSafety(rawPlan);
  const owner = await getCurrentUser().catch(() => null);
  const session: Session = {
    id: newId(),
    createdAt: new Date().toISOString(),
    patientName,
    doctorName,
    language: demo ? "English" : language,
    defaultDepth,
    notes,
    plan,
    safety: report,
    demo,
    outputs,
    ...(owner && { ownerId: owner._id.toHexString() }),
  };
  await saveSession(session);
  return NextResponse.json(session);
}
