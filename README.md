# Opero

Doctors write procedure notes the way they always do. Opero turns them into something the patient
actually understands: a narrated 3D walkthrough, step-by-step pictures, and a plain-language report —
in the patient's own language — sent to their phone in one click.

Live: https://opero-ochre.vercel.app

## What it does

- **Reads clinical shorthand.** "Pt 46F, lap chole under GA, NPO after midnight, RTC if fever >38.5C"
  becomes calm, sixth-grade language.
- **Explains the whole picture.** What's happening in the body, why this plan, what other options the
  doctor mentioned, what happens step by step, and how to recover.
- **Never graphic.** Visuals come from a fixed library of gentle 3D scenes, so blood, cuts and needles
  can't appear. A second pass rewrites any graphic wording — except warning signs, which stay plain so
  patients know when to get help.
- **Answers questions.** A chatbot grounded strictly in the doctor's notes; when something isn't
  covered it says so instead of guessing.
- **Sends in one step.** WhatsApp (or SMS) with a single link to everything.

## Stack

Next.js (App Router) · Tailwind + shadcn/ui · Motion · react-three-fiber for the 3D scenes ·
Gemini for the rewriting, Q&A and narration voice · MongoDB Atlas · deployed on Vercel.

## Running it

```bash
npm install
cp .env.example .env.local   # add the keys below
npm run dev
```

| Variable | Needed for |
| --- | --- |
| `MONGODB_URI`, `MONGODB_DB`, `MONGODB_COLLECTION` | accounts, walkthroughs, cached narration |
| `GEMINI_API_KEY` | rewriting the notes, the Q&A, and the narration voice |
| `NEXT_PUBLIC_APP_URL` | the address used in links sent to patients |
| `SESSION_SECRET` | signs the sign-in cookie |
| `ELEVENLABS_API_KEY` | optional, replaces the Gemini narration voice |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | optional, sends SMS server-side |

Without a Gemini key the app falls back to a built-in sample walkthrough, so the demo still runs.

## Layout

```
src/app           routes: landing, sign-up, dashboard, patient page (/p), report (/r), API
src/components    dashboard, 3D scene library, video player, gallery, report
src/lib           Gemini prompts, safety filter, storage, sessions, voice
tests             unit tests (npm test)
```

## Tests

```bash
npm test          # safety filter, grounded answers, API validation
npx tsc --noEmit  # types
npm run lint
```

## Note

Opero explains care in everyday words based on what the doctor wrote. It does not give medical advice,
and it only ever says what is in the notes.
