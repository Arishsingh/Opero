import { getSession } from "@/lib/store";
import { DEPTHS, type Depth } from "@/lib/types";
import { hasGeminiVoice, speak } from "@/lib/voice";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnAvuAP8"; // "Sarah" — soft, reassuring
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

// GET /api/tts?id=<session>&step=<index | summary>&depth=<calm|standard|detailed>
// Uses ElevenLabs when configured, otherwise Gemini TTS. URLs are deterministic, so the CDN/browser
// cache each clip after its first synthesis.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key && !hasGeminiVoice()) return new Response("Voice not configured", { status: 501 });

  const session = await getSession(url.searchParams.get("id") ?? "");
  if (!session) return new Response("Not found", { status: 404 });

  const depthParam = url.searchParams.get("depth") as Depth;
  const depth: Depth = DEPTHS.includes(depthParam) ? depthParam : session.defaultDepth;
  const stepParam = url.searchParams.get("step") ?? "summary";
  const text =
    stepParam === "summary"
      ? session.plan.summary[depth]
      : session.plan.steps[Number(stepParam)]?.narration[depth];
  if (!text) return new Response("Not found", { status: 404 });

  // No ElevenLabs key: use Gemini's natural-sounding voice (cached after the first request).
  if (!key) {
    try {
      const wav = await speak(text, session.language);
      return new Response(new Uint8Array(wav), {
        headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
      });
    } catch (err) {
      console.error("Gemini voice failed", String(err).slice(0, 200));
      // Rate-limited or unavailable: the player falls back to the device voice.
      return new Response("Voice unavailable", { status: 503 });
    }
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.65, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
      }),
    }
  );
  if (!res.ok) {
    console.error("ElevenLabs error", res.status, await res.text().catch(() => ""));
    return new Response("Voice synthesis failed", { status: 502 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
