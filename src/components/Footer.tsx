"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["How It Works", "#how-it-works"],
      ["Doctor Portal", "/doctor"],
      ["Patient Experience", "#patients"],
      ["Safety", "#safety"],
      ["Languages", "#help"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "#"],
      ["Careers", "#"],
      ["Press Kit", "#"],
      ["Contact", "#"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Help Center", "#help"],
      ["Clinical Guide", "#"],
      ["Research", "#"],
      ["Blog", "#"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "#"],
      ["Terms of Service", "#"],
      ["Medical Disclaimer", "#"],
      ["Cookie Policy", "#"],
    ],
  },
];

const icon = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SOCIALS: [string, ReactNode][] = [
  [
    "X",
    <svg key="x" width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" />
    </svg>,
  ],
  [
    "Instagram",
    <svg key="ig" {...icon}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>,
  ],
  [
    "LinkedIn",
    <svg key="in" {...icon}>
      <path d="M7 10v7M7 7v.01M11 17v-7M11 13.5a3 3 0 0 1 6 0V17" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>,
  ],
  [
    "YouTube",
    <svg key="yt" {...icon}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10.5 9.5 4 2.5-4 2.5z" />
    </svg>,
  ],
];

function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 256 256" aria-hidden>
      <path
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
        fill="#192837"
      />
    </svg>
  );
}

/** Soft layered hills along the bottom edge of the footer card. */
function Mountains() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px] w-full sm:h-[220px] lg:h-[260px]" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7C6D9" />
          <stop offset="1" stopColor="#F3D9E6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hill-mid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8F7BE8" />
          <stop offset="0.6" stopColor="#B7A4F2" />
          <stop offset="1" stopColor="#E7C3E4" />
        </linearGradient>
        <linearGradient id="hill-front" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C6B4F5" />
          <stop offset="0.5" stopColor="#9C86EC" />
          <stop offset="1" stopColor="#D9B8EC" />
        </linearGradient>
        <filter id="hill-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d="M0 210 C 180 150 320 120 520 170 S 900 110 1100 150 S 1360 120 1440 140 V320 H0Z" fill="url(#hill-back)" />
      <path
        d="M-40 300 C 120 250 260 180 420 175 C 520 172 560 205 640 230 C 760 268 900 255 1040 235 C 1180 215 1320 240 1480 270 V320 H-40Z"
        fill="url(#hill-mid)"
        opacity="0.85"
        filter="url(#hill-blur)"
      />
      <path d="M-40 320 C 200 290 420 300 640 305 C 900 312 1120 285 1480 300 V320 H-40Z" fill="url(#hill-front)" opacity="0.9" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative w-full overflow-hidden rounded-t-[32px] border-t border-white/80"
        style={{ background: "linear-gradient(180deg, #FDFBFC 0%, #FAF1F5 45%, #F4E4F0 100%)" }}
      >
        <Mountains />
        {/* Film grain */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35] mix-blend-soft-light" aria-hidden>
          <filter id="footer-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#footer-grain)" />
        </svg>

        <div className="relative mx-auto max-w-[1280px] px-5 pb-40 pt-12 sm:px-8 sm:pb-52 sm:pt-14">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
            <div className="max-w-[320px]">
              <Link href="/" className="flex items-center gap-2.5" aria-label="Opero home">
                <Logo />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", letterSpacing: "-0.01em" }}>Opero</span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed opacity-70">
                Helping care teams turn dense procedure notes into calm walkthroughs their patients actually understand.
              </p>
              <div className="mt-6 flex gap-2.5">
                {SOCIALS.map(([label, svg]) => (
                  <motion.a
                    key={label}
                    href="#"
                    aria-label={label}
                    whileHover={{ y: -2 }}
                    className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#192837]/15 bg-white/70 transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                  >
                    {svg}
                  </motion.a>
                ))}
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4" aria-label="Footer">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <p className="mb-4 text-sm font-semibold">{col.title}</p>
                  <ul className="space-y-2.5">
                    {col.links.map(([label, href]) => (
                      <li key={label}>
                        <Link href={href} className="text-sm opacity-60 transition-opacity hover:opacity-100">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t border-[#192837]/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="opacity-60">© {new Date().getFullYear()} Opero. All rights reserved. Opero explains procedures; it does not replace medical advice.</span>
            <span className="flex items-center gap-1.5 opacity-70">
              Made with <Heart size={12} fill="currentColor" style={{ color: "var(--color-brand)" }} /> for calmer care
            </span>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
