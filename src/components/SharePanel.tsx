"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { Session } from "@/lib/types";
import { publicBaseUrl } from "@/lib/publicUrl";

export default function SharePanel({ session }: { session: Session }) {
  const link = `${publicBaseUrl()}/p/${session.id}`;
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function sendSms() {
    setStatus("Sending…");
    const res = await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id, to: phone, link }),
    });
    if (res.status === 501) {
      // No Twilio configured — hand off to the device's own messaging app.
      const text = `${session.doctorName} shared a short, calm walkthrough of your procedure: ${link}`;
      window.location.href = `sms:${phone}?&body=${encodeURIComponent(text)}`;
      setStatus("Opened your messaging app");
      return;
    }
    const data = await res.json();
    setStatus(res.ok ? "✓ Sent" : data.error ?? "Failed to send");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 sm:flex-row sm:items-center">
      <div className="shrink-0 self-center rounded-xl bg-white p-2">
        <QRCodeSVG value={link} size={112} fgColor="#1d2b29" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold">Send to your patient — nothing to download</p>
        <div className="flex gap-2">
          <input readOnly value={link} className="min-w-0 flex-1 truncate rounded-lg border border-line bg-cream px-3 py-2 font-mono text-xs" />
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg border border-line px-3 text-xs font-medium hover:border-teal"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <a href={link} target="_blank" className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:border-teal">
            Open
          </a>
        </div>
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 415 555 0123"
            inputMode="tel"
            className="min-w-0 flex-1 rounded-lg border border-line bg-cream px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button onClick={sendSms} disabled={!phone.trim()} className="rounded-lg bg-teal px-3 text-xs font-semibold text-white disabled:opacity-40">
            Text link
          </button>
        </div>
        {status && <p className="text-xs text-subtle">{status}</p>}
      </div>
    </div>
  );
}
