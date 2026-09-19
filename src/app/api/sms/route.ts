import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getSession, updateSession } from "@/lib/store";
import { patientMessage } from "@/lib/message";

// Delivers the patient link. channel "whatsapp" is recorded here and opened client-side via wa.me;
// otherwise sends an SMS via Twilio when configured. Without Twilio the client
// falls back to an sms: link that opens the doctor's own messaging app.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const to = String(body?.to ?? "").replace(/[^\d+]/g, "");
  const link = String(body?.link ?? "");
  const session = await getSession(String(body?.id ?? ""));
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Walkthroughs created from the dashboard can only be sent by the doctor who owns them.
  if (session.ownerId) {
    const user = await getCurrentUser();
    if (user?._id.toHexString() !== session.ownerId) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!/^\+\d{8,15}$/.test(to)) {
    return NextResponse.json({ error: "Use international format, e.g. +14155550123" }, { status: 400 });
  }

  const record = () =>
    updateSession(session.id, { sentAt: new Date().toISOString(), sentTo: [...new Set([...(session.sentTo ?? []), to])] });

  // WhatsApp: the doctor's own WhatsApp opens with the message ready (wa.me click-to-chat); just record it.
  if (body?.channel === "whatsapp") {
    await record();
    return NextResponse.json({ ok: true, channel: "whatsapp" });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    await record();
    return NextResponse.json({ configured: false, message: patientMessage(session, link) }, { status: 501 });
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: patientMessage(session, link) }),
  });
  if (!res.ok) {
    console.error("Twilio error", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "SMS failed to send" }, { status: 502 });
  }
  await record();
  return NextResponse.json({ ok: true });
}
