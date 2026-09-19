"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRightCircle, CheckCircle2, Loader2 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

function Logo({ color = "#192837" }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 256 256" fill="none" aria-hidden>
      <path
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
        fill={color}
      />
    </svg>
  );
}

/** Art panel: the gradient image, with a soft bottom shade so the copy stays readable. */
function ArtPanel() {
  return (
    <div className="relative hidden overflow-hidden rounded-[28px] lg:block" style={{ background: "#1B0A3D" }}>
      <Image src="/signup-art.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

      <div className="relative flex h-full flex-col justify-between p-10 text-white">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo color="white" />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>Opero</span>
        </Link>
        <div className="max-w-[440px]">
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 2.6vw, 2.25rem)", lineHeight: 1.08 }}>
            Calmer patients. Clearer consent. Minutes back for you.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Turn dense procedure notes into gentle 3D walkthroughs, narrated in your patient&apos;s own language.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupView() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setExisting(Boolean(data.existing));
      setStatus("done");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div
      className="grid min-h-dvh w-full gap-4 bg-white p-3 sm:p-4 lg:grid-cols-[1fr_1.05fr]"
      style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}
    >
      <ArtPanel />

      <div className="relative flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 lg:invisible" aria-label="Opero home">
            <Logo />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem" }}>Opero</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60">
            <ArrowLeft size={16} /> Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-[440px]">
            <AnimatePresence mode="wait">
              {status !== "done" ? (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  noValidate
                >
                  <h1
                    className="mb-12 text-center"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.9rem, 4vw, 2.6rem)", letterSpacing: "-0.01em", lineHeight: 1.1 }}
                  >
                    Welcome to Opero
                  </h1>

                  <label htmlFor="email" className="mb-2.5 block text-sm font-medium opacity-60">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "email-error" : undefined}
                    className="w-full rounded-full border border-[#E3E3E3] bg-white px-6 py-4 text-base outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[#4A1D96]/10"
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        id="email-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pt-2 text-sm text-[#C9594D]"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={status === "loading" || !email.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#252B30] py-4 text-base font-medium text-white transition-opacity disabled:opacity-50"
                  >
                    {status === "loading" ? <Loader2 size={18} className="animate-spin" /> : "Continue"}
                  </motion.button>

                  <p className="mt-8 text-center text-xs leading-relaxed opacity-55">
                    By continuing, you agree to our{" "}
                    <a href="#" className="underline underline-offset-2">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline underline-offset-2">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="text-center"
                  role="status"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                    className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full"
                    style={{ background: "#EFE7FF", color: "var(--color-brand)" }}
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.7rem, 3.5vw, 2.2rem)", lineHeight: 1.1 }}>
                    {existing ? "Welcome back" : "You're in"}
                  </h1>
                  <p className="mx-auto mt-3 flex max-w-[340px] items-center justify-center gap-2 text-sm leading-relaxed opacity-70">
                    <Loader2 size={15} className="animate-spin" /> Taking you to your dashboard…
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                    style={{ color: "var(--color-brand)" }}
                  >
                    Not redirected? Open dashboard <ArrowRightCircle size={16} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
