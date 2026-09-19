import { NextResponse } from "next/server";
import { LEGACY_COOKIE, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/", req.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(LEGACY_COOKIE);
  return response;
}
