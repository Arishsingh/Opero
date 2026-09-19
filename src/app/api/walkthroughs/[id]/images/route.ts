import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getSession, updateSession } from "@/lib/store";

const MAX_IMAGE_BYTES = 400_000; // per image, base64 length
const IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// Saves the step illustrations the dashboard rendered from the safe 3D scene library.
export async function POST(req: Request, ctx: RouteContext<"/api/walkthroughs/[id]/images">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const session = await getSession(id);
  if (!session || session.ownerId !== user._id.toHexString()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const images: unknown = body?.images;
  if (
    !Array.isArray(images) ||
    images.length !== session.plan.steps.length ||
    !images.every((img) => typeof img === "string" && img.length <= MAX_IMAGE_BYTES && IMAGE.test(img))
  ) {
    return NextResponse.json({ error: "Expected one image per step" }, { status: 400 });
  }
  await updateSession(id, { images: images as string[] });
  return NextResponse.json({ ok: true });
}
