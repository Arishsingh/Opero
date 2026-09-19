"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BCP47: Record<string, string> = {
  English: "en-US", Spanish: "es-ES", Hindi: "hi-IN", "Mandarin Chinese": "zh-CN", Arabic: "ar-SA",
  French: "fr-FR", Portuguese: "pt-BR", Bengali: "bn-IN", Tagalog: "fil-PH", Vietnamese: "vi-VN",
  German: "de-DE", Japanese: "ja-JP", Korean: "ko-KR", Italian: "it-IT", Polish: "pl-PL", Tamil: "ta-IN",
};

/**
 * Plays the ElevenLabs clip for a step. If voice isn't configured (501) or fails,
 * falls back to the browser's built-in speech so the walkthrough always has a voice.
 */
export function useNarrator(language: string, onEnd?: () => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  // Called when a clip finishes on its own (not when stopped), e.g. to auto-advance a video.
  const endRef = useRef(onEnd);
  useEffect(() => {
    endRef.current = onEnd;
  });
  // Bumped on every stop/play, so a cancelled utterance's late "end" event is ignored.
  const run = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"elevenlabs" | "browser" | null>(null);

  const stop = useCallback(() => {
    run.current++;
    audio.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPlaying(false);
    setLoading(false);
  }, []);

  useEffect(() => stop, [stop]);

  /** Last resort: the device's own voice, choosing the most natural one it has. Returns false if none. */
  const speakBrowser = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth) return false;
      const u = new SpeechSynthesisUtterance(text);
      const mine = run.current;
      const lang = BCP47[language] ?? "en-US";
      u.lang = lang;
      const voices = synth.getVoices().filter((v) => v.lang.replace("_", "-").startsWith(lang.split("-")[0]));
      const natural = /natural|neural|premium|enhanced|siri|samantha|google/i;
      u.voice = voices.find((v) => natural.test(v.name) && v.lang.replace("_", "-") === lang) ?? voices.find((v) => natural.test(v.name)) ?? voices[0] ?? null;
      u.rate = 0.95;
      u.pitch = 1;
      u.onend = () => {
        if (run.current !== mine) return;
        setPlaying(false);
        endRef.current?.();
      };
      synth.cancel();
      synth.speak(u);
      setSource("browser");
      setPlaying(true);
      return true;
    },
    [language]
  );

  /** Plays the natural voice clip, falling back to the device voice. Resolves with what's playing. */
  const play = useCallback(
    async (url: string, text: string): Promise<"voice" | "browser" | "none" | "stopped"> => {
      stop();
      setLoading(true);
      if (!audio.current) audio.current = new Audio();
      const el = audio.current;
      el.src = url;
      const mine = run.current;
      el.onended = () => {
        if (run.current !== mine) return;
        setPlaying(false);
        endRef.current?.();
      };
      try {
        await el.play();
        if (run.current !== mine) {
          // Stopped (or moved on) while the clip was still loading.
          el.pause();
          return "stopped";
        }
        setSource("elevenlabs");
        setPlaying(true);
        return "voice";
      } catch {
        if (run.current !== mine) return "stopped";
        return speakBrowser(text) ? "browser" : "none";
      } finally {
        if (run.current === mine) setLoading(false);
      }
    },
    [stop, speakBrowser]
  );

  return { play, stop, playing, loading, source };
}
