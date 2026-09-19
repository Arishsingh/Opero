export const DEPTHS = ["calm", "standard", "detailed"] as const;
export type Depth = (typeof DEPTHS)[number];

export const DEPTH_LABELS: Record<Depth, { label: string; hint: string }> = {
  calm: { label: "Just the basics", hint: "Short and reassuring" },
  standard: { label: "A bit more", hint: "Clear, everyday detail" },
  detailed: { label: "Full picture", hint: "Every step explained" },
};

// The 3D visual layer can only be composed from these safe, pre-built scenes.
// Gemini chooses from this list — it can never ask for anything graphic.
export const SCENES = [
  "welcome",
  "sleep",
  "entry",
  "inflate",
  "camera",
  "repair",
  "remove",
  "close",
  "monitor",
  "recovery",
  "home",
] as const;
export type SceneKind = (typeof SCENES)[number];

export const REGIONS = [
  "head",
  "chest",
  "heart",
  "upper-abdomen",
  "lower-abdomen",
  "pelvis",
  "back",
  "arm",
  "leg",
  "whole-body",
] as const;
export type BodyRegion = (typeof REGIONS)[number];

export type Layered = Record<Depth, string>;

export interface Step {
  title: string;
  scene: SceneKind;
  region: BodyRegion;
  text: Layered;
  narration: Layered;
}

export interface GlossaryItem {
  term: string; // exact phrase from the doctor's notes
  friendly: string; // plain-English analogy shown to the doctor in Dual-View
}

/** "What's happening in your body" — the diagnosis, explained kindly. */
export interface Condition {
  name: string;
  explanation: Layered;
}

/** "Why this plan is right for you" — only reasons and options the doctor actually wrote. */
export interface Approach {
  whyThisPlan: string[];
  otherOptions: { name: string; note: string }[];
  outlook: string;
}

export interface Plan {
  procedureName: string;
  summary: Layered;
  /** Optional so walkthroughs saved before these sections existed still load. */
  condition?: Condition;
  approach?: Approach;
  steps: Step[];
  glossary: GlossaryItem[];
  instructions: {
    before: string[];
    after: string[];
    callDoctorIf: string[];
  };
}

export interface SafetyReport {
  passed: boolean;
  replaced: { from: string; to: string; count: number }[];
}

/** What the doctor asked Opero to produce for the patient. */
export interface Outputs {
  video: boolean;
  images: boolean;
  report: boolean;
}
export const ALL_OUTPUTS: Outputs = { video: true, images: true, report: true };

export interface Session {
  id: string;
  createdAt: string;
  patientName: string;
  doctorName: string;
  language: string;
  defaultDepth: Depth;
  notes: string;
  plan: Plan;
  safety: SafetyReport;
  demo: boolean;
  outputs?: Outputs;
  /** Signed-in doctor who created it (dashboard). */
  ownerId?: string;
  /** One illustration per step, rendered from the safe 3D scenes (JPEG data URLs). */
  images?: string[];
  sentAt?: string;
  sentTo?: string[];
  /** Questions asked in the dashboard chat after creation, with their grounded answers. */
  chat?: ChatEntry[];
}

export interface ChatEntry {
  question: string;
  answer: string;
  at: string;
}

export type SessionSummary = Pick<Session, "id" | "createdAt" | "patientName" | "sentAt"> & { procedureName: string };

export const LANGUAGES = [
  "English",
  "Spanish",
  "Hindi",
  "Mandarin Chinese",
  "Arabic",
  "French",
  "Portuguese",
  "Bengali",
  "Tagalog",
  "Vietnamese",
  "German",
  "Japanese",
  "Korean",
  "Italian",
  "Polish",
  "Tamil",
];
