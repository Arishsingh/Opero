import { NextResponse } from "next/server";
import { hasMongo, users } from "@/lib/mongodb";
import { LEGACY_COOKIE, SESSION_COOKIE, sessionCookieOptions, sessionToken } from "@/lib/session";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!hasMongo()) {
    return NextResponse.json({ error: "Sign-up isn't configured yet (MONGODB_URI is missing)." }, { status: 503 });
  }

  try {
    const now = new Date();
    // New email → create the user. Existing email → record the new sign-in.
    const res = await (await users()).findOneAndUpdate(
      { email },
      {
        $setOnInsert: { email, createdAt: now, source: "website" },
        $set: { lastLoginAt: now },
        $inc: { loginCount: 1 },
      },
      { upsert: true, returnDocument: "after", includeResultMetadata: true }
    );
    const user = res.value;
    if (!user) throw new Error("upsert returned no document");

    const response = NextResponse.json({ ok: true, existing: Boolean(res.lastErrorObject?.updatedExisting) });
    response.cookies.set(SESSION_COOKIE, sessionToken(user.email), sessionCookieOptions);
    response.cookies.delete(LEGACY_COOKIE);
    return response;
  } catch (err) {
    console.error("signup failed", err);
    const unreachable = err instanceof Error && /ECONNREFUSED|ServerSelection|ENOTFOUND|timed out/i.test(`${err.name} ${err.message}`);
    return NextResponse.json(
      { error: unreachable ? "Can't reach the database right now. Please try again in a moment." : "Something went wrong. Please try again." },
      { status: unreachable ? 503 : 500 }
    );
  }
}
