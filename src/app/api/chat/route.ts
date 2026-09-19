import { NextResponse } from "next/server";
import { answerQuestion, hasGemini, type ChatMessage } from "@/lib/gemini";
import { getSession } from "@/lib/store";
import { demoAnswer } from "@/lib/demo";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const session = await getSession(String(body?.id ?? ""));
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const messages: ChatMessage[] = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: ChatMessage) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const last = messages.at(-1);
  if (!last || last.role !== "user") return NextResponse.json({ error: "No question" }, { status: 400 });

  try {
    const answer = hasGemini() ? await answerQuestion(session, messages) : demoAnswer(session, last.content);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("chat failed", err);
    return NextResponse.json({ answer: "I'm having trouble right now. Please contact your care team with your question." });
  }
}
