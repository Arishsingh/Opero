"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRightCircle, HeartPulse, Menu, Sparkles, Stethoscope, X } from "lucide-react";

const NAV_LINKS = ["How It Works", "Doctors", "Patients", "Safety", "Help"];
const anchor = (link: string) => `#${link.toLowerCase().replace(/\s+/g, "-")}`;
// Served locally so the hero plays instantly, even on slow venue Wi-Fi.
const VIDEO_SRC = "/hero.mp4";
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: EASE },
  }),
};

const iconStyle = { display: "inline", verticalAlign: "middle", position: "relative", top: -2 } as const;

function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" overflow="visible" viewBox="0 0 256 256" aria-label="Opero">
      <path
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
        fill="#192837"
      />
    </svg>
  );
}

function NavButtons({ stacked = false }: { stacked?: boolean }) {
  const base = `rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-105 ${stacked ? "w-full text-center" : ""}`;
  return (
    <>
      <Link href="/signup" className={`${base} text-white`} style={{ background: "var(--color-brand)" }}>
        Start For Free
      </Link>
    </>
  );
}

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ fontFamily: "var(--font-body)", color: "var(--color-text)", background: "#FCE8EE" }}>
      {/* Brightened + multiplied over pink: the video's pale backdrop turns pink, the animated objects stay visible. */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        style={{ mixBlendMode: "multiply", filter: "brightness(1.18) contrast(1.05)" }}
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
      />
      <nav className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" aria-label="Opero home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link} href={anchor(link)} className="text-sm font-medium transition-opacity hover:opacity-60">
              {link}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NavButtons />
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
          <Menu size={26} />
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40"
              style={{ background: "rgba(25,40,55,0.35)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed right-0 top-0 z-50 flex flex-col px-6 py-5"
              style={{
                width: "min(88vw, 360px)",
                height: "100dvh",
                background: "#CFC8C5",
                boxShadow: "-12px 0 48px rgba(25,40,55,0.18)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <div className="flex items-center justify-between pb-5">
                <Logo />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <X size={26} />
                </button>
              </div>
              <div className="h-px w-full" style={{ background: "rgba(25,40,55,0.15)" }} />

              <ul className="flex flex-col gap-1 py-6">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.4, ease: EASE }}
                  >
                    <a
                      href={anchor(link)}
                      onClick={() => setMenuOpen(false)}
                      className="block py-3 text-2xl transition-opacity hover:opacity-60"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {link}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                className="mt-auto flex flex-col gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + NAV_LINKS.length * 0.07, duration: 0.4, ease: EASE }}
              >
                <NavButtons stacked />
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8" style={{ paddingTop: "clamp(40px, 8vw, 72px)" }}>
        <div style={{ maxWidth: 560 }}>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.65rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "#192837",
              marginBottom: 24,
            }}
          >
            <Stethoscope size={24} color="#192837" style={iconStyle} aria-hidden /> Turn Scary Surgery Notes{" "}
            <HeartPulse size={24} color="#192837" style={iconStyle} aria-hidden /> into Calm, Clear Walkthroughs{" "}
            <Sparkles size={24} color="#192837" style={iconStyle} aria-hidden />
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              lineHeight: 1.65,
              opacity: 0.8,
              maxWidth: 560,
              marginBottom: 32,
            }}
          >
            Zero jargon, zero fear. Opero turns dense procedure notes into gentle 3D visuals, a warm voice in your
            patient&apos;s own language, and answers grounded in your instructions.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="inline-block">
            <motion.div whileHover={{ scale: 1.04, filter: "brightness(1.1)" }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/signup"
                className="flex items-center justify-between font-semibold text-white"
                style={{
                  background: "var(--color-brand)",
                  borderRadius: 50,
                  padding: "17px 24px",
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  boxShadow: "0 4px 24px rgba(74,29,150,0.35)",
                  minWidth: 210,
                  gap: 32,
                }}
              >
                Try It Free
                <ArrowRightCircle size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
