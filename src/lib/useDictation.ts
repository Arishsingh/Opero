"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor() {
  const w = window as unknown as Record<string, (new () => SpeechRecognitionLike) | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useDictation(onText: (text: string) => void) {
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const supported = useSyncExternalStore(
    () => () => {},
    () => Boolean(getRecognitionCtor()),
    () => false
  );
  const cb = useRef(onText);
  useEffect(() => {
    cb.current = onText;
  });

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (!rec.current) {
      const r = new Ctor();
      r.continuous = true;
      r.interimResults = false;
      r.lang = "en-US";
      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) cb.current(e.results[i][0].transcript.trim());
        }
      };
      r.onend = () => setListening(false);
      rec.current = r;
    }
    rec.current.start();
    setListening(true);
  }

  return {
    supported,
    listening,
    start,
    stop: () => {
      rec.current?.stop();
      setListening(false);
    },
  };
}
