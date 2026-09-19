import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { hasMongo, users } from "./mongodb";

// Keeps the doctor signed in until they press "Sign out".
// The cookie holds their email, signed with a server secret so it can't be forged or edited.
// Email-only sign-up has no password, so this is "remember me", not strong authentication.
export const SESSION_COOKIE = "opero_session";
export const LEGACY_COOKIE = "opero_uid"; // older cookie (user id), still accepted
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function secret() {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  // Stable fallback so sessions survive restarts even without SESSION_SECRET.
  return createHash("sha256").update(`opero-session|${process.env.MONGODB_URI ?? "local"}`).digest("hex");
}

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function sessionToken(email: string) {
  const payload = Buffer.from(email, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function emailFromToken(token: string | undefined) {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Buffer.from(payload, "base64url").toString("utf8");
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/** Who is signed in, without touching the database, so a slow or unreachable DB never signs anyone out. */
export async function getSignedInEmail(): Promise<string | null> {
  const jar = await cookies();
  const email = emailFromToken(jar.get(SESSION_COOKIE)?.value);
  if (email) return email;
  // Older cookie: look the user up once.
  const legacy = jar.get(LEGACY_COOKIE)?.value;
  if (legacy && ObjectId.isValid(legacy) && hasMongo()) {
    const user = await (await users()).findOne({ _id: new ObjectId(legacy) }).catch(() => null);
    return user?.email ?? null;
  }
  return null;
}

/** The signed-in user's record (recreated if it went missing, so they're never silently logged out). */
export async function getCurrentUser() {
  const email = await getSignedInEmail();
  if (!email || !hasMongo()) return null;
  try {
    const now = new Date();
    return await (await users()).findOneAndUpdate(
      { email },
      { $setOnInsert: { email, createdAt: now, lastLoginAt: now, loginCount: 1, source: "session" } },
      { upsert: true, returnDocument: "after" }
    );
  } catch (err) {
    console.error("getCurrentUser failed", err);
    return null;
  }
}
