"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  ChevronsUpDown,
  Copy,
  FileText,
  Globe,
  Images,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Backdrop from "./Backdrop";
import VideoPlayer from "@/components/outputs/VideoPlayer";
import ImageGallery from "@/components/outputs/ImageGallery";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SAMPLE_NOTES } from "@/lib/demo";
import { patientMessage } from "@/lib/message";
import { publicBaseUrl } from "@/lib/publicUrl";
import { useDictation } from "@/lib/useDictation";
import { cn } from "@/lib/utils";
import {
  ALL_OUTPUTS,
  DEPTHS,
  DEPTH_LABELS,
  LANGUAGES,
  type Depth,
  type Outputs,
  type Session,
  type SessionSummary,
} from "@/lib/types";

const SceneSnapshots = dynamic(
  () => import("@/components/Scene3D").then((m) => m.SceneSnapshots),
  { ssr: false },
);

const EASE = [0.22, 1, 0.36, 1] as const;
const DRAFT = "__draft__";
const GEN_STAGES = [
  "Reading your notes…",
  "Translating jargon into plain words…",
  "Applying visual safety boundaries…",
  "Composing calm 3D scenes…",
];
const OUTPUT_META: { id: keyof Outputs; label: string; icon: LucideIcon }[] = [
  { id: "video", label: "Video", icon: PlayCircle },
  { id: "images", label: "Images", icon: Images },
  { id: "report", label: "Report", icon: FileText },
];

type Msg = {
  id: string;
  role: "assistant" | "user";
  text: string;
  time?: string;
  label?: string;
  thinking?: boolean;
};
type QA = { role: "user" | "assistant"; content: string };
type Form = {
  patientName: string;
  doctorName: string;
  language: string;
  depth: Depth;
  outputs: Outputs;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const clock = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function doctorFromEmail(email: string) {
  const first =
    email
      .split("@")[0]
      .split(/[._\-+0-9]/)
      .find(Boolean) ?? "";
  return first
    ? `Dr. ${first[0].toUpperCase()}${first.slice(1)}`
    : "Your doctor";
}

function resultMessage(s: Session): Msg {
  const o = s.outputs ?? ALL_OUTPUTS;
  const made = [
    o.video && "a narrated video",
    o.images && `${s.plan.steps.length} images`,
    o.report && "an easy-language report",
  ]
    .filter(Boolean)
    .join(", ");
  const rewrites = s.safety.replaced.length;
  return {
    id: `result-${s.id}`,
    role: "assistant",
    label: s.demo ? "Ready · demo mode" : "Ready",
    text: `Done. I created ${made} for ${s.patientName || "your patient"}, in ${s.language}. ${s.plan.glossary.length} medical terms are explained in plain words, and the safety check passed${rewrites ? ` after rewriting ${rewrites} phrase${rewrites > 1 ? "s" : ""}` : ""}.\n\nEverything is on the right. Press "Send to patient" when you're ready. You can also ask me anything your patient might ask.`,
  };
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden>
      <path
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ───────────────────────────── Sidebar (ChatGPT-style) ───────────────────────────── */

function Sidebar({
  email,
  history,
  activeId,
  loadingId,
  onSelect,
  onNew,
  onSignOut,
  onDelete,
  drawer = false,
}: {
  email: string;
  history: SessionSummary[];
  activeId: string | null;
  loadingId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSignOut: () => void;
  onDelete: (id: string) => void;
  /** In the slide-in menu on smaller screens it's always visible. */
  drawer?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "sent">("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = history.filter(
    (h) =>
      (filter === "all" || h.sentAt) &&
      `${h.patientName} ${h.procedureName}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const navItem = (active: boolean) =>
    cn(
      "relative flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm transition",
      active
        ? "text-foreground"
        : "text-foreground/70 hover:bg-white/50 hover:text-foreground",
    );

  return (
    <aside
      className={cn(
        "min-h-0 flex-col rounded-[22px] border border-white/50 bg-white/40 p-3 backdrop-blur-xl",
        drawer ? "flex h-full" : "hidden xl:flex",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5 px-1.5 pt-1">
        <Link
          href="/dashboard"
          aria-label="Opero home"
          className="grid size-8 place-items-center rounded-lg bg-[#1E1433] text-white shadow"
        >
          <LogoMark className="size-3.5" />
        </Link>
        <span className="text-[15px] font-semibold tracking-tight">Opero</span>
      </div>

      <div className="space-y-0.5">
        <button
          onClick={onNew}
          className={cn(
            navItem(false),
            "bg-white/60 font-medium text-foreground shadow-[0_1px_2px_rgba(60,30,50,0.06)] hover:bg-white/80",
          )}
        >
          <SquarePen className="size-4" /> New walkthrough
        </button>
        <label className="flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm text-foreground/70 focus-within:bg-white/60">
          <Search className="size-4" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search walkthroughs"
            className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/60"
          />
          <Kbd>/</Kbd>
        </label>
        {(["all", "sent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={navItem(filter === f)}
          >
            {filter === f && (
              <motion.span
                layoutId="side-filter"
                className="absolute inset-0 rounded-xl bg-white/70 shadow-[0_1px_2px_rgba(60,30,50,0.06)]"
              />
            )}
            {f === "all" ? (
              <MessageSquare className="relative size-4" />
            ) : (
              <Send className="relative size-4" />
            )}
            <span className="relative">
              {f === "all" ? "All walkthroughs" : "Sent to patients"}
            </span>
          </button>
        ))}
      </div>

      <p className="mb-1.5 mt-5 px-2.5 text-xs font-medium text-muted-foreground">
        Chats
      </p>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {shown.length === 0 ? (
          <p className="px-2.5 text-xs leading-relaxed text-muted-foreground/80">
            {history.length
              ? "Nothing matches."
              : "Your walkthroughs will appear here."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {shown.map((h) => (
                <motion.li
                  key={h.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0 }}
                  className="group relative"
                >
                  {confirmId === h.id ? (
                    <div className="space-y-2 rounded-xl bg-rose-50/90 px-2.5 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-rose-900">Delete this walkthrough?</p>
                        <p className="text-[11px] leading-snug text-rose-900/70">The patient&apos;s link will stop working.</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setConfirmId(null);
                            onDelete(h.id);
                          }}
                          className="flex-1 rounded-lg bg-rose-600 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                        <button onClick={() => setConfirmId(null)} className="flex-1 rounded-lg bg-white/80 py-1.5 text-xs text-muted-foreground hover:bg-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelect(h.id)}
                        title={`${h.patientName || "Unnamed patient"} · ${h.procedureName}`}
                        className={cn(
                          "w-full rounded-xl py-2 pl-2.5 pr-9 text-left transition hover:bg-white/55",
                          activeId === h.id && "bg-white/75 shadow-[0_1px_2px_rgba(60,30,50,0.06)]",
                        )}
                      >
                        <p className="flex items-center gap-1.5 truncate text-sm">
                          <span className="truncate">
                            {h.patientName || "Unnamed patient"} · {h.procedureName}
                          </span>
                          {loadingId === h.id && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary" />}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(h.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          {h.sentAt && " · sent"}
                        </p>
                      </button>
                      <button
                        onClick={() => setConfirmId(h.id)}
                        aria-label={`Delete ${h.patientName || "walkthrough"}`}
                        className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mt-3 flex items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-white/55">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#F4B8CF] to-[#C9B6F2] text-sm font-semibold uppercase text-[#1E1433]">
              {email[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {doctorFromEmail(email)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {email}
              </span>
            </span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onSignOut}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}

/* ───────────────────────────── Chat (middle) ───────────────────────────── */

function Message({ msg }: { msg: Msg }) {
  const [copied, setCopied] = useState(false);
  if (msg.role === "user") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-3xl rounded-br-lg bg-black/[0.055] px-4 py-3 text-[15px]">
          {msg.label && (
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              {msg.label}
            </p>
          )}
          <p className="line-clamp-[8] whitespace-pre-wrap leading-relaxed">
            {msg.text}
          </p>
          {msg.time && (
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {msg.time}
            </p>
          )}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex gap-3"
    >
      <span
        className="mt-0.5 size-7 shrink-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #FFE3EE, #F4B8CF 55%, #C9B6F2)",
        }}
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        {msg.label && (
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs",
              msg.thinking ? "shimmer-text" : "text-muted-foreground",
            )}
          >
            {!msg.thinking && <Sparkles className="size-3" />}
            {msg.label}
          </p>
        )}
        {msg.text && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {msg.text}
          </p>
        )}
        {!msg.thinking && msg.text && (
          <button
            aria-label="Copy message"
            onClick={() => {
              navigator.clipboard.writeText(msg.text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="text-muted-foreground/70 transition hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Composer({
  value,
  setValue,
  onSend,
  busy,
  asking,
  form,
  setForm,
  dictation,
  outputs,
  onOutputs,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  busy: boolean;
  asking: boolean;
  form: Form;
  setForm: (f: Partial<Form>) => void;
  dictation: ReturnType<typeof useDictation>;
  /** When a walkthrough exists: its outputs, and a handler to change them. */
  outputs?: Outputs;
  onOutputs?: (o: Outputs) => void;
}) {
  const chip =
    "flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/70 px-3 text-xs text-foreground/80 transition hover:bg-white";
  return (
    <motion.div
      layout
      className="rounded-[26px] border border-white/90 bg-white/90 p-3 shadow-[0_10px_40px_-14px_rgba(60,30,50,0.3)] transition focus-within:shadow-[0_10px_40px_-12px_rgba(74,29,150,0.3)]"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={asking ? 1 : 3}
        placeholder={
          asking
            ? "Ask a question as your patient would…"
            : "Describe the procedure: paste or dictate your clinical notes…"
        }
        className="max-h-48 min-h-[44px] w-full resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
      />

      <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2 pt-1">
        {!asking && (
          <>
            <label className={chip}>
              <UserRound className="size-3.5 opacity-60" />
              <input
                value={form.patientName}
                onChange={(e) => setForm({ patientName: e.target.value })}
                placeholder="Patient name"
                className="w-24 bg-transparent outline-none placeholder:text-foreground/50"
              />
            </label>
            <Select
              value={form.language}
              onValueChange={(v) => setForm({ language: v })}
            >
              <SelectTrigger
                size="sm"
                className={cn(chip, "h-8 w-auto shadow-none")}
              >
                <Globe className="size-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.depth}
              onValueChange={(v) => setForm({ depth: v as Depth })}
            >
              <SelectTrigger
                size="sm"
                className={cn(chip, "h-8 w-auto shadow-none")}
              >
                <SlidersHorizontal className="size-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTHS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DEPTH_LABELS[d].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="mx-1 h-4 w-px bg-black/10" />
          </>
        )}
        {asking && (
          <span className="mr-1 text-xs text-muted-foreground">
            Include for patient:
          </span>
        )}
        {OUTPUT_META.map((o) => {
          const current = outputs ?? form.outputs;
          const on = current[o.id];
          return (
            <button
              key={o.id}
              data-output={o.id}
              aria-pressed={on}
              title={
                asking
                  ? `${on ? "Remove" : "Add"} ${o.label.toLowerCase()} for this patient`
                  : undefined
              }
              onClick={() => {
                const next = { ...current, [o.id]: !on };
                if (!(next.video || next.images || next.report)) return;
                if (onOutputs) onOutputs(next);
                else setForm({ outputs: next });
              }}
              className={cn(
                chip,
                on &&
                  "border-primary/25 bg-[#EFE7FF] text-primary hover:bg-[#E7DCFF]",
              )}
            >
              {on ? (
                <Check className="size-3.5" />
              ) : (
                <o.icon className="size-3.5 opacity-60" />
              )}
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 px-1">
        {!asking && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground"
                onClick={() => setValue(SAMPLE_NOTES)}
                aria-label="Use sample notes"
              >
                <FileText />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use sample notes</TooltipContent>
          </Tooltip>
        )}
        {dictation.supported && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8 rounded-full text-muted-foreground",
                  dictation.listening &&
                    "animate-pulse bg-rose-100 text-rose-600",
                )}
                onClick={dictation.listening ? dictation.stop : dictation.start}
                aria-label={dictation.listening ? "Stop dictating" : "Dictate"}
              >
                <Mic />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {dictation.listening ? "Stop dictating" : "Dictate"}
            </TooltipContent>
          </Tooltip>
        )}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onSend}
          disabled={!value.trim() || busy}
          aria-label="Send"
          className="ml-auto grid size-9 place-items-center rounded-full bg-[#1E1433] text-white transition disabled:bg-black/10 disabled:text-black/30"
        >
          <ArrowUp className="size-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────── Generated outputs (right) ───────────────────────────── */

function SectionTitle({
  icon: Icon,
  children,
  right,
}: {
  icon: LucideIcon;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 text-primary" />
      {children}
      <span className="ml-auto text-xs font-normal text-muted-foreground">
        {right}
      </span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-2xl bg-white/50", className)} />
  );
}

/** Renders the step images from the 3D scene library, invisibly behind the app. */
function ImageRenderer({
  session,
  onDone,
  onProgress,
}: {
  session: Session;
  onDone: (images: string[]) => void;
  onProgress: (n: number) => void;
}) {
  const shots = useRef<string[]>([]);
  return (
    // Kept inside the viewport (behind the app, fully transparent): browsers may skip canvases far off-screen.
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 -z-20 opacity-0"
    >
      <SceneSnapshots
        items={session.plan.steps}
        onShot={(i, url) => {
          shots.current[i] = url;
          onProgress(i + 1);
          if (i === session.plan.steps.length - 1) onDone([...shots.current]);
        }}
      />
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.8h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.7.97.99-3.61-.23-.37a9.77 9.77 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.81-9.8a9.74 9.74 0 0 1 6.93 2.87 9.74 9.74 0 0 1 2.87 6.94c0 5.4-4.4 9.8-9.8 9.8zm8.34-18.14A11.72 11.72 0 0 0 12.04.2C5.54.2.25 5.5.25 11.99c0 2.08.54 4.1 1.58 5.89L.15 24l6.26-1.64a11.8 11.8 0 0 0 5.63 1.43h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.23-6.11-3.46-8.34z" />
    </svg>
  );
}

type Channel = "whatsapp" | "sms";

function SendPanel({
  session,
  onSent,
}: {
  session: Session;
  onSent: (to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [status, setStatus] = useState<{
    kind: "idle" | "sending" | "sent" | "error";
    text?: string;
  }>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const o = session.outputs ?? ALL_OUTPUTS;
  const link = `${publicBaseUrl()}/p/${session.id}`;

  async function send() {
    const to = phone.replace(/[^\d+]/g, "");
    if (!/^\+\d{8,15}$/.test(to))
      return setStatus({
        kind: "error",
        text: "Include the country code (e.g. +91 for India, +1 for the US)",
      });

    if (channel === "whatsapp") {
      // Must open synchronously on the click, or the browser blocks it as a pop-up.
      window.open(
        `https://wa.me/${to.slice(1)}?text=${encodeURIComponent(patientMessage(session, link))}`,
        "_blank",
        "noopener",
      );
      setStatus({
        kind: "sent",
        text: `WhatsApp opened for ${to}. Press send there.`,
      });
      onSent(to);
      await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id, to, link, channel }),
      }).catch(() => {});
      return;
    }

    setStatus({ kind: "sending" });
    const res = await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id, to, link }),
    }).catch(() => null);
    if (!res)
      return setStatus({ kind: "error", text: "Couldn't reach the server." });
    const data = await res.json().catch(() => ({}));
    if (res.status === 501) {
      // No SMS provider configured: open the doctor's own messaging app with the message ready.
      window.location.href = `sms:${to}?&body=${encodeURIComponent(data.message ?? link)}`;
      onSent(to);
      return setStatus({
        kind: "sent",
        text: `Opened your messaging app for ${to}`,
      });
    }
    if (!res.ok)
      return setStatus({ kind: "error", text: data.error ?? "Failed to send" });
    onSent(to);
    setStatus({ kind: "sent", text: `Sent to ${to}` });
  }

  return (
    <div className="border-t border-white/60 p-3">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mb-3 space-y-3 rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-medium">
                Send to {session.patientName || "your patient"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {OUTPUT_META.filter((m) => o[m.id]).map((m) => (
                  <span
                    key={m.id}
                    className="flex items-center gap-1 rounded-full bg-[#EFE7FF] px-2.5 py-1 text-xs text-primary"
                  >
                    <m.icon className="size-3" /> {m.label}
                  </span>
                ))}
              </div>
              <div
                className="grid grid-cols-2 gap-1 rounded-xl bg-black/[0.04] p-1"
                role="radiogroup"
                aria-label="Send via"
              >
                {(["whatsapp", "sms"] as const).map((c) => (
                  <button
                    key={c}
                    role="radio"
                    aria-checked={channel === c}
                    onClick={() => setChannel(c)}
                    className={cn(
                      "relative flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition",
                      channel === c
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {channel === c && (
                      <motion.span
                        layoutId="send-channel"
                        className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      />
                    )}
                    {c === "whatsapp" ? (
                      <WhatsAppIcon className="relative size-3.5 text-[#25D366]" />
                    ) : (
                      <MessageSquare className="relative size-3.5" />
                    )}
                    <span className="relative">
                      {c === "whatsapp" ? "WhatsApp" : "SMS"}
                    </span>
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2"
              >
                <Input
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Patient phone number, with country code"
                  inputMode="tel"
                  className="h-10 rounded-xl bg-white"
                />
                <Button
                  type="submit"
                  disabled={!phone.trim() || status.kind === "sending"}
                  className={cn(
                    "h-10 rounded-xl px-4",
                    channel === "whatsapp" &&
                      "bg-[#25D366] text-white hover:bg-[#1FB855]",
                  )}
                >
                  {channel === "whatsapp" && (
                    <WhatsAppIcon className="size-4" />
                  )}
                  {status.kind === "sending" ? "Sending…" : "Send"}
                </Button>
              </form>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={cn(
                    status.kind === "error"
                      ? "text-rose-600"
                      : status.kind === "sent"
                        ? "text-emerald-700"
                        : "text-muted-foreground",
                  )}
                >
                  {status.text ??
                    (channel === "whatsapp"
                      ? "Opens WhatsApp with the message ready: one link to everything above."
                      : "One text with a link to everything above.")}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                  className="flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Link2 className="size-3.5" />
                  )}{" "}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1E1433] text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(30,20,51,0.6)]"
      >
        <Send className="size-4" />
        {open ? "Close" : session.sentAt ? "Send again" : "Send to patient"}
      </motion.button>
    </div>
  );
}

function OutputsPanel({
  session,
  generating,
  imageProgress,
  onSent,
  panel,
}: {
  panel: "chat" | "outputs";
  session: Session | null;
  generating: boolean;
  imageProgress: number | null;
  onSent: (to: string) => void;
}) {
  const o = session?.outputs ?? ALL_OUTPUTS;
  return (
    <section
      className={cn(
        "min-h-0 flex-col overflow-hidden rounded-[22px] border border-white/60 bg-white/35 backdrop-blur-2xl",
        panel === "outputs" ? "flex" : "hidden lg:flex",
      )}
    >
      <div className="flex items-center gap-2 px-5 py-4">
        <p className="text-sm font-medium">Generated for your patient</p>
        {session?.sentAt && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
            <Check className="size-3" /> Sent
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-5">
        {!session ? (
          generating ? (
            <div className="space-y-6">
              <div>
                <SectionTitle icon={PlayCircle}>Video</SectionTitle>
                <Skeleton className="aspect-video" />
              </div>
              <div>
                <SectionTitle icon={Images}>Images</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-[4/3]" />
                  ))}
                </div>
              </div>
              <div>
                <SectionTitle icon={FileText}>Report</SectionTitle>
                <Skeleton className="h-28" />
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center py-10 text-center">
              <div className="max-w-[260px] space-y-4">
                <div className="flex justify-center -space-x-3">
                  {OUTPUT_META.map((m, i) => (
                    <motion.span
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="grid size-12 place-items-center rounded-2xl border border-white/80 bg-white/80 shadow-sm"
                    >
                      <m.icon className="size-5 text-primary" />
                    </motion.span>
                  ))}
                </div>
                <p className="font-medium">Video, images and report</p>
                <p className="text-sm text-muted-foreground">
                  Describe the procedure in the chat. Everything Opero creates
                  for your patient appears here, ready to send.
                </p>
              </div>
            </div>
          )
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="space-y-6"
            >
              {o.video && (
                <div>
                  <SectionTitle
                    icon={PlayCircle}
                    right={`${session.plan.steps.length} scenes · narrated`}
                  >
                    Video
                  </SectionTitle>
                  <VideoPlayer session={session} compact />
                </div>
              )}
              {o.images && (
                <div>
                  <SectionTitle
                    icon={Images}
                    right={
                      imageProgress !== null && !session.images
                        ? `Rendering ${imageProgress}/${session.plan.steps.length}`
                        : `${session.plan.steps.length} images`
                    }
                  >
                    Images
                  </SectionTitle>
                  {session.images ? (
                    <ImageGallery
                      session={session}
                      depth={session.defaultDepth}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {session.plan.steps.slice(0, 4).map((_, i) => (
                        <Skeleton key={i} className="aspect-[4/3]" />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {o.report && (
                <div>
                  <SectionTitle icon={FileText} right="Easy language">
                    Report
                  </SectionTitle>
                  <a
                    href={`/r/${session.id}`}
                    target="_blank"
                    className="group block rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:bg-white"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Your procedure, explained
                    </p>
                    <p className="mt-1 font-medium">
                      {session.plan.procedureName}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {session.plan.summary[session.defaultDepth]}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{session.plan.steps.length} steps</span>
                      <span>
                        {session.plan.instructions.before.length +
                          session.plan.instructions.after.length}{" "}
                        care tips
                      </span>
                      <span>
                        {session.plan.glossary.length} terms explained
                      </span>
                      <span className="ml-auto font-medium text-primary group-hover:underline">
                        Open · PDF
                      </span>
                    </p>
                  </a>
                </div>
              )}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Passed the visual safety
                filter
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {session && (
        <SendPanel key={session.id} session={session} onSent={onSent} />
      )}
    </section>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function Dashboard({
  userEmail,
  photo = false,
}: {
  userEmail: string;
  photo?: boolean;
}) {
  const router = useRouter();
  const [form, setFormState] = useState<Form>({
    patientName: "",
    doctorName: doctorFromEmail(userEmail),
    language: "English",
    depth: "standard",
    outputs: ALL_OUTPUTS,
  });
  const setForm = (f: Partial<Form>) =>
    setFormState((prev) => ({ ...prev, ...f }));
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, Msg[]>>({});
  const [qa, setQa] = useState<Record<string, QA[]>>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"chat" | "outputs">("chat");
  const listRef = useRef<HTMLDivElement>(null);
  const dictation = useDictation((t) => setInput((v) => (v ? `${v} ${t}` : t)));

  const session = activeId ? (sessions[activeId] ?? null) : null;
  const key = activeId ?? DRAFT;
  const messages = useMemo(() => threads[key] ?? [], [threads, key]);
  const firstName = form.doctorName.replace(/^Dr\.\s*/, "");
  const generating = busy && !session;

  useEffect(() => {
    fetch("/api/walkthroughs")
      .then((r) => (r.ok ? r.json() : { walkthroughs: [] }))
      .then((d) => setHistory(d.walkthroughs ?? []))
      .catch(() => {});
  }, []);

  // Survive refreshes: reopen the walkthrough named in the URL, and restore unsent typing + chip settings.
  const draftKey = `opero:draft:${userEmail}`;
  const restored = useRef(false);
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(draftKey) ?? "null") as { input?: string; form?: Partial<Form> } | null;
        if (saved?.form) setFormState((prev) => ({ ...prev, ...saved.form }));
        if (saved?.input) setInput(saved.input);
      } catch {
        // storage unavailable (private mode etc.): start fresh
      }
      const w = new URLSearchParams(window.location.search).get("w");
      restored.current = true;
      if (w) openWalkthrough(w);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on load

  useEffect(() => {
    if (!restored.current) return;
    const url = activeId ? `/dashboard?w=${activeId}` : "/dashboard";
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
  }, [activeId]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ input, form }));
    } catch {
      // ignore
    }
  }, [input, form, draftKey]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, busy]);

  const push = useCallback(
    (k: string, ...msgs: Msg[]) =>
      setThreads((t) => ({ ...t, [k]: [...(t[k] ?? []), ...msgs] })),
    [],
  );
  const patch = (k: string, id: string, m: Partial<Msg>) =>
    setThreads((t) => ({
      ...t,
      [k]: (t[k] ?? []).map((x) => (x.id === id ? { ...x, ...m } : x)),
    }));

  async function openWalkthrough(id: string) {
    if (sessions[id]) return setActiveId(id);
    setLoadingId(id);
    try {
      const res = await fetch(`/api/walkthroughs/${id}`);
      if (!res.ok) return;
      const s = (await res.json()) as Session;
      setSessions((all) => ({ ...all, [s.id]: s }));
      setThreads((t) =>
        t[s.id]
          ? t
          : {
              ...t,
              [s.id]: [
                {
                  id: `notes-${s.id}`,
                  role: "user",
                  label: "Procedure notes",
                  text: s.notes,
                  time: clock(new Date(s.createdAt)),
                },
                resultMessage(s),
                ...(s.chat ?? []).flatMap((c, i): Msg[] => [
                  { id: `q-${s.id}-${i}`, role: "user", text: c.question, time: clock(new Date(c.at)) },
                  { id: `a-${s.id}-${i}`, role: "assistant", label: "Answered from your notes", text: c.answer },
                ]),
              ],
            },
      );
      setQa((q) =>
        q[s.id]
          ? q
          : { ...q, [s.id]: (s.chat ?? []).flatMap((c): QA[] => [{ role: "user", content: c.question }, { role: "assistant", content: c.answer }]) },
      );
      setActiveId(id);
    } finally {
      setLoadingId(null);
    }
  }

  async function generate(notes: string) {
    const thinkingId = uid();
    push(
      DRAFT,
      {
        id: uid(),
        role: "user",
        text: notes,
        time: clock(),
        label: "Procedure notes",
      },
      {
        id: thinkingId,
        role: "assistant",
        text: "",
        label: GEN_STAGES[0],
        thinking: true,
      },
    );
    let i = 0;
    const timer = setInterval(
      () =>
        patch(DRAFT, thinkingId, {
          label: GEN_STAGES[Math.min(++i, GEN_STAGES.length - 1)],
        }),
      1400,
    );
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      const s = data as Session;
      setSessions((all) => ({ ...all, [s.id]: s }));
      setThreads((t) => {
        const draft = (t[DRAFT] ?? []).filter((m) => m.id !== thinkingId);
        const next = { ...t, [s.id]: [...draft, resultMessage(s)] };
        delete next[DRAFT];
        return next;
      });
      setHistory((h) => [
        {
          id: s.id,
          createdAt: s.createdAt,
          patientName: s.patientName,
          procedureName: s.plan.procedureName,
        },
        ...h,
      ]);
      setActiveId(s.id);
      if (s.outputs?.images !== false) setImageProgress(0);
      if (s.outputs?.video !== false) prepareVoices(s);
    } catch (err) {
      patch(DRAFT, thinkingId, {
        thinking: false,
        label: "Couldn't create the walkthrough",
        text: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      clearInterval(timer);
    }
  }

  /** Creates the narration clips in the background (one at a time, to respect rate limits), so Play starts instantly. */
  async function prepareVoices(s: Session) {
    for (let i = 0; i < s.plan.steps.length; i++) {
      const res = await fetch(`/api/tts?id=${s.id}&step=${i}&depth=${s.defaultDepth}`).catch(() => null);
      if (!res?.ok) return; // no voice available (or rate-limited): the player falls back gracefully
      await res.arrayBuffer();
    }
  }

  async function ask(question: string, s: Session) {
    const thinkingId = uid();
    push(
      s.id,
      { id: uid(), role: "user", text: question, time: clock() },
      {
        id: thinkingId,
        role: "assistant",
        text: "",
        label: `Checking ${s.doctorName}'s instructions…`,
        thinking: true,
      },
    );
    const history: QA[] = [
      ...(qa[s.id] ?? []),
      { role: "user", content: question },
    ];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, messages: history }),
      });
      const data = await res.json();
      const answer =
        data.answer ?? data.error ?? "Sorry, something went wrong.";
      setQa((q) => ({
        ...q,
        [s.id]: [...history, { role: "assistant", content: answer }],
      }));
      patch(s.id, thinkingId, {
        thinking: false,
        label: "Answered from your notes",
        text: answer,
      });
      if (res.ok && data.answer) {
        fetch(`/api/walkthroughs/${s.id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer }),
        }).catch(() => {});
      }
    } catch {
      patch(s.id, thinkingId, {
        thinking: false,
        label: "Connection problem",
        text: "I couldn't reach the server. Please try again.",
      });
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    dictation.stop();
    if (!session && text.length < 20) {
      push(
        DRAFT,
        { id: uid(), role: "user", text, time: clock() },
        {
          id: uid(),
          role: "assistant",
          text: "Could you describe the procedure in a few sentences, or paste the clinical notes? You can also tap the document icon to try a sample.",
        },
      );
      return;
    }
    setBusy(true);
    await (session ? ask(text, session) : generate(text));
    setBusy(false);
  }

  async function saveImages(s: Session, images: string[]) {
    setSessions((all) => ({ ...all, [s.id]: { ...all[s.id], images } }));
    setImageProgress(null);
    await fetch(`/api/walkthroughs/${s.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    }).catch(() => {});
  }

  async function changeOutputs(s: Session, outputs: Outputs) {
    setSessions((all) => ({ ...all, [s.id]: { ...all[s.id], outputs } }));
    if (outputs.images && !s.images) setImageProgress(0); // turned on later: create the pictures now
    await fetch(`/api/walkthroughs/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputs }),
    }).catch(() => {});
  }

  function markSent(s: Session, to: string) {
    const sentAt = new Date().toISOString();
    setSessions((all) => ({
      ...all,
      [s.id]: {
        ...all[s.id],
        sentAt,
        sentTo: [...new Set([...(all[s.id].sentTo ?? []), to])],
      },
    }));
    setHistory((h) => h.map((x) => (x.id === s.id ? { ...x, sentAt } : x)));
  }

  async function deleteWalkthrough(id: string) {
    const res = await fetch(`/api/walkthroughs/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return;
    setHistory((h) => h.filter((x) => x.id !== id));
    setSessions((all) => {
      const next = { ...all };
      delete next[id];
      return next;
    });
    setThreads((t) => {
      const next = { ...t };
      delete next[id];
      return next;
    });
    if (activeId === id) newWalkthrough();
  }

  function newWalkthrough() {
    setActiveId(null);
    setThreads((t) => {
      const next = { ...t };
      delete next[DRAFT];
      return next;
    });
    setInput("");
  }

  async function signOut() {
    await fetch("/api/signout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const needsImages =
    session && (session.outputs ?? ALL_OUTPUTS).images && !session.images;
  const empty = messages.length === 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="relative isolate h-dvh overflow-hidden px-3 py-2 sm:px-5 sm:py-3 lg:px-8 lg:py-4"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <Backdrop photo={photo} />
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex h-full w-full flex-col gap-3 overflow-hidden rounded-[30px] border border-white/40 bg-white/[0.14] p-3 text-foreground shadow-[0_40px_120px_-30px_rgba(90,40,60,0.55)] backdrop-blur-xl"
        >
          {/* Small screens: menu button + Chat / Outputs switch */}
          <div className="flex shrink-0 items-center gap-2 px-1 xl:hidden">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/60 bg-white/60 text-foreground/70 backdrop-blur"
            >
              <Menu className="size-4" />
            </button>
            <button
              onClick={newWalkthrough}
              aria-label="New walkthrough"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/60 bg-white/60 text-foreground/70 backdrop-blur"
            >
              <SquarePen className="size-4" />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {session ? `${session.patientName || "Unnamed patient"} · ${session.plan.procedureName}` : "New walkthrough"}
            </p>
            <div className="flex shrink-0 rounded-xl bg-black/[0.06] p-0.5 text-xs font-medium lg:hidden">
              {(["chat", "outputs"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setPanel(v)}
                  aria-pressed={panel === v}
                  className={cn("relative rounded-lg px-3 py-1.5 transition", panel === v ? "text-foreground" : "text-muted-foreground")}
                >
                  {panel === v && <motion.span layoutId="panel-switch" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                  <span className="relative">{v === "chat" ? "Chat" : "Outputs"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(330px,380px)] xl:grid-cols-[260px_minmax(0,1fr)_minmax(380px,440px)]">
          <Sidebar
            email={userEmail}
            history={history}
            activeId={activeId}
            loadingId={loadingId}
            onSelect={openWalkthrough}
            onNew={newWalkthrough}
            onSignOut={signOut}
            onDelete={deleteWalkthrough}
          />

          {/* Chat */}
          <section
            className={cn(
              "min-h-0 flex-col overflow-hidden rounded-[22px] border border-white/80 bg-[#FFFCFA]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_50px_-25px_rgba(80,30,50,0.35)]",
              panel === "chat" ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="flex items-center gap-3 border-b border-black/[0.05] px-5 py-3.5">
              <div className="hidden min-w-0 xl:block">
                <p className="truncate text-sm font-medium">
                  {session
                    ? `${session.patientName || "Unnamed patient"} · ${session.plan.procedureName}`
                    : "New walkthrough"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session
                    ? `${session.language} · ${DEPTH_LABELS[session.defaultDepth].label}`
                    : "Opero Assistant"}
                </p>
              </div>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Safety filter on
              </span>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
              {empty ? (
                <div className="mx-auto flex h-full max-w-[720px] flex-col justify-center px-5 py-10">
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mb-2 text-center text-2xl font-medium tracking-tight sm:text-[28px]"
                  >
                    What are we explaining today, {firstName}?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="mb-7 text-center text-sm text-muted-foreground"
                  >
                    Write the procedure in your own words. Opero turns it into a
                    video, images and an easy report.
                  </motion.p>
                  <Composer
                    value={input}
                    setValue={setInput}
                    onSend={send}
                    busy={busy}
                    asking={false}
                    form={form}
                    setForm={setForm}
                    dictation={dictation}
                  />
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      "Laparoscopic gallbladder removal",
                      "Knee arthroscopy",
                      "Cataract surgery",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setInput(
                            s === "Laparoscopic gallbladder removal"
                              ? SAMPLE_NOTES
                              : `${s}: `,
                          )
                        }
                        className="rounded-full border border-black/[0.07] bg-white/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:bg-white hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-[720px] space-y-6 px-5 py-6">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <Message key={m.id} msg={m} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {!empty && (
              <div className="mx-auto w-full max-w-[760px] px-4 pb-4">
                <Composer
                  value={input}
                  setValue={setInput}
                  onSend={send}
                  busy={busy}
                  asking={!!session}
                  form={form}
                  setForm={setForm}
                  dictation={dictation}
                  outputs={
                    session ? (session.outputs ?? ALL_OUTPUTS) : undefined
                  }
                  onOutputs={
                    session ? (o) => changeOutputs(session, o) : undefined
                  }
                />
              </div>
            )}
          </section>

          <OutputsPanel
            panel={panel}
            session={session}
            generating={generating}
            imageProgress={imageProgress}
            onSent={(to) => session && markSent(session, to)}
          />
          </div>
        </motion.div>

        {/* Slide-in menu (below 1280px, where the sidebar isn't shown) */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-[#1E1433]/30 backdrop-blur-sm xl:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.35, ease: EASE }}
                className="fixed inset-y-0 left-0 z-50 w-[min(86vw,300px)] p-3 xl:hidden"
                role="dialog"
                aria-label="Menu"
              >
                <Sidebar
                  drawer
                  email={userEmail}
                  history={history}
                  activeId={activeId}
                  loadingId={loadingId}
                  onSelect={(id) => {
                    setMenuOpen(false);
                    setPanel("chat");
                    openWalkthrough(id);
                  }}
                  onNew={() => {
                    setMenuOpen(false);
                    setPanel("chat");
                    newWalkthrough();
                  }}
                  onSignOut={signOut}
                  onDelete={deleteWalkthrough}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {needsImages && session && (
          <ImageRenderer
            key={session.id}
            session={session}
            onProgress={setImageProgress}
            onDone={(imgs) => saveImages(session, imgs)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
