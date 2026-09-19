import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { deleteSession, getSession, updateSession } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/walkthroughs/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const session = await getSession(id);
  if (!session || session.ownerId !== user._id.toHexString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

/** Change which outputs (video / images / report) this walkthrough includes for the patient. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/walkthroughs/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const session = await getSession(id);
  if (!session || session.ownerId !== user._id.toHexString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const o = (await req.json().catch(() => null))?.outputs;
  const outputs = { video: o?.video === true, images: o?.images === true, report: o?.report === true };
  if (!outputs.video && !outputs.images && !outputs.report) {
    return NextResponse.json({ error: "Keep at least one: video, images or report." }, { status: 400 });
  }
  await updateSession(id, { outputs });
  return NextResponse.json({ ok: true, outputs });
}

/** Deletes a walkthrough. Only the doctor who created it can. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/walkthroughs/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const session = await getSession(id);
  if (!session || session.ownerId !== user._id.toHexString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await deleteSession(id);
  return NextResponse.json({ ok: true });
}
