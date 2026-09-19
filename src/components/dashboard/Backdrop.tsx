"use client";

import { motion } from "framer-motion";

/**
 * Soft desert-sunset scene behind the dashboard.
 * Drop a photo at public/dashboard-bg.jpg and it layers on top automatically
 * (a missing file just leaves the painted scene visible).
 */
export default function Backdrop({ photo = false }: { photo?: boolean }) {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #D9AFC0 0%, #EBC0C3 22%, #F5CDBF 42%, #F3C3AE 60%, #E0A58D 80%, #C98B77 100%)" }}
      />
      {/* Sun glow */}
      <motion.div
        className="absolute left-[62%] top-[18%] h-[46vmax] w-[46vmax] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,236,220,0.95) 0%, rgba(255,214,200,0.5) 40%, transparent 70%)" }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Layered sandstone ridges */}
      <svg className="absolute inset-x-0 bottom-0 h-[62%] w-full" viewBox="0 0 1440 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rock-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E3A993" />
            <stop offset="1" stopColor="#E6B8A5" />
          </linearGradient>
          <linearGradient id="rock-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C8795C" />
            <stop offset="0.5" stopColor="#DA9A7C" />
            <stop offset="1" stopColor="#B36A52" />
          </linearGradient>
          <linearGradient id="rock-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E4D3CB" />
            <stop offset="1" stopColor="#C9B3AA" />
          </linearGradient>
          <filter id="rock-soft">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path d="M0 330 C 160 290 300 250 470 275 C 620 298 760 230 930 250 C 1100 270 1260 220 1440 240 V600 H0Z" fill="url(#rock-far)" filter="url(#rock-soft)" opacity="0.8" />
        <path d="M820 600 C 900 470 980 330 1080 250 C 1150 196 1230 170 1300 190 C 1370 210 1410 250 1440 280 V600Z" fill="url(#rock-mid)" filter="url(#rock-soft)" />
        <path d="M1090 330 C 1160 300 1240 300 1320 320 M1060 390 C 1150 360 1260 362 1440 380 M1010 460 C 1120 430 1260 432 1440 450" stroke="#F3D6C8" strokeOpacity="0.55" strokeWidth="5" fill="none" filter="url(#rock-soft)" />
        <path d="M0 520 C 220 470 420 480 640 505 C 880 532 1100 500 1440 520 V600 H0Z" fill="url(#rock-near)" filter="url(#rock-soft)" />
      </svg>
      {/* Real photo, if provided */}
      {photo && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/dashboard-bg.jpg)" }} />}
      {/* Film grain + gentle vignette */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.22] mix-blend-soft-light">
        <filter id="dash-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dash-grain)" />
      </svg>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(80,40,50,0.18) 100%)" }} />
    </div>
  );
}
