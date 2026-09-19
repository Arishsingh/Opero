import { createHash } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { Binary } from "mongodb";
import { hasMongo, voicesCollection } from "./mongodb";

// Natural narration from Gemini's text-to-speech models. Each clip is generated once and cached
// (memory + MongoDB), because TTS is slow (~8s) and the free tier allows few requests per day.
const MODELS = [process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts", "gemini-3.1-flash-tts-preview"];
const VOICE = process.env.GEMINI_TTS_VOICE ?? "Sulafat"; // warm, gentle voice

const memory = new Map<string, Buffer>();
const MAX_MEMORY = 200;

export const hasGeminiVoice = () => Boolean(process.env.GEMINI_API_KEY);

/** How it should sound: this is what makes it feel human rather than robotic. */
function direction(language: string) {
  return `Read the following aloud in ${language}. Speak slowly, softly and warmly, like a kind, experienced nurse gently reassuring a nervous patient at their bedside. Sound natural and human: relaxed pace, gentle smile in the voice, natural pauses between sentences, never rushed, never robotic. Only read the text itself.\n\n`;
}

/** Wraps raw 16-bit mono PCM in a WAV header so browsers can play it. */
function pcmToWav(pcm: Buffer, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synthesize(text: string, language: string): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: direction(language) + text,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      });
      const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part?.inlineData?.data) throw new Error("No audio returned");
      const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType ?? "")?.[1] ?? 24000);
      return pcmToWav(Buffer.from(part.inlineData.data, "base64"), rate);
    } catch (err) {
      lastErr = err;
      console.warn(`Gemini TTS ${model} failed:`, String(err).slice(0, 160));
    }
  }
  throw lastErr;
}

/** Returns a WAV clip for this text, generating it only the first time. */
export async function speak(text: string, language: string): Promise<Buffer> {
  const key = createHash("sha256").update(`${VOICE}|${language}|${text}`).digest("hex");
  const cached = memory.get(key);
  if (cached) return cached;

  if (hasMongo()) {
    const doc = await (await voicesCollection()).findOne({ key }).catch(() => null);
    if (doc) {
      const buf = Buffer.from(doc.audio.buffer);
      remember(key, buf);
      return buf;
    }
  }

  const wav = await synthesize(text, language);
  remember(key, wav);
  if (hasMongo()) {
    await (await voicesCollection())
      .updateOne({ key }, { $set: { key, audio: new Binary(wav), createdAt: new Date() } }, { upsert: true })
      .catch((err) => console.warn("voice cache save failed", err));
  }
  return wav;
}

function remember(key: string, buf: Buffer) {
  if (memory.size >= MAX_MEMORY) memory.delete(memory.keys().next().value!);
  memory.set(key, buf);
}
