import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getSession, updateSession } from "@/lib/store";

const MAX_ENTRIES = 200;

/** Saves one question + answer to the walkthrough, so the chat survives refreshes. */
export async function POST(req: Request, ctx: RouteContext<"/api/walkthroughs/[id]/chat">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const session = await getSession(id);
  if (!session || session.ownerId !== user._id.toHexString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const question = String(body?.question ?? "").slice(0, 2000).trim();
  const answer = String(body?.answer ?? "").slice(0, 4000).trim();
  if (!question || !answer) return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
  const chat = [...(session.chat ?? []), { question, answer, at: new Date().toISOString() }].slice(-MAX_ENTRIES);
  await updateSession(id, { chat });
  return NextResponse.json({ ok: true });
}
