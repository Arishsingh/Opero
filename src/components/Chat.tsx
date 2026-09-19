"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat({
  sessionId,
  doctorName,
  embedded,
}: {
  sessionId: string;
  doctorName: string;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  // Scroll only the message list — scrollIntoView would also scroll the doctor's page in Dual-View.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.answer ?? data.error ?? "Sorry, something went wrong." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't connect. Please try again or contact your care team." }]);
    } finally {
      setBusy(false);
    }
  }

  const pos = embedded ? "absolute" : "fixed";
  const suggestions = ["When can I shower?", "Can I eat before surgery?", "What should I watch out for?"];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`${pos} bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg transition active:scale-95`}
      >
        <span aria-hidden>💬</span> Ask a question
      </button>
    );
  }

  return (
    <div className={`${pos} inset-x-0 bottom-0 z-30 flex max-h-[75%] flex-col rounded-t-3xl border-t border-line bg-paper shadow-2xl ${embedded ? "" : "sm:mx-auto sm:max-w-md"}`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <p className="text-sm font-semibold">Ask about your care</p>
          <p className="text-xs text-subtle">Answers come only from {doctorName}&apos;s instructions</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1 text-sm text-subtle hover:bg-cream" aria-label="Close chat">
          ✕
        </button>
      </div>

      <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-subtle">Try asking:</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-line bg-cream px-3 py-2 text-left hover:border-teal">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`fade-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed ${m.role === "user" ? "bg-teal text-white" : "bg-teal-soft"}`}>
              {m.content}
            </p>
          </div>
        ))}
        {busy && <p className="text-subtle">Thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="flex-1 rounded-full border border-line bg-cream px-4 py-2 text-sm outline-none focus:border-teal"
        />
        <button disabled={busy || !input.trim()} className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}
