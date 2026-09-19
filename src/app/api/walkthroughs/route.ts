import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listSessions } from "@/lib/store";

// The signed-in doctor's walkthrough history (for the dashboard sidebar).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ walkthroughs: await listSessions(user._id.toHexString()) });
}
