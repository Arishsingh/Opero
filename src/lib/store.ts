import { promises as fs } from "fs";
import path from "path";
import type { Session, SessionSummary } from "./types";
import { hasMongo, sessionsCollection } from "./mongodb";

// Storage for walkthroughs, in order of preference:
// 1. MongoDB (Atlas) — shared by every server instance, lets doctors see their history.
// 2. Upstash Redis (REST).
// 3. Local JSON files — zero-setup fallback for a laptop.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const TTL_SECONDS = 60 * 60 * 24 * 30;

const DATA_DIR = process.env.VERCEL ? "/tmp/opero-sessions" : path.join(process.cwd(), ".data", "sessions");

async function redis(command: (string | number)[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  return (await res.json()).result;
}

const safeId = (id: string) => /^[a-zA-Z0-9_-]{6,40}$/.test(id);
const redisEnabled = () => Boolean(REDIS_URL && REDIS_TOKEN);

export async function saveSession(session: Session) {
  if (hasMongo()) {
    await (await sessionsCollection()).replaceOne({ id: session.id }, session, { upsert: true });
    return;
  }
  if (redisEnabled()) {
    await redis(["SET", `opero:session:${session.id}`, JSON.stringify(session), "EX", TTL_SECONDS]);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${session.id}.json`), JSON.stringify(session));
}

export async function getSession(id: string): Promise<Session | null> {
  if (!safeId(id)) return null;
  if (hasMongo()) {
    return (await (await sessionsCollection()).findOne({ id }, { projection: { _id: 0 } })) as Session | null;
  }
  if (redisEnabled()) {
    const raw = await redis(["GET", `opero:session:${id}`]);
    return raw ? (JSON.parse(raw) as Session) : null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8")) as Session;
  } catch {
    return null;
  }
}

export async function updateSession(id: string, patch: Partial<Session>) {
  if (hasMongo()) {
    await (await sessionsCollection()).updateOne({ id }, { $set: patch });
    return;
  }
  const current = await getSession(id);
  if (current) await saveSession({ ...current, ...patch });
}

/** Permanently removes a walkthrough (its patient link stops working). */
export async function deleteSession(id: string) {
  if (!safeId(id)) return;
  if (hasMongo()) {
    await (await sessionsCollection()).deleteOne({ id });
    return;
  }
  if (redisEnabled()) {
    await redis(["DEL", `opero:session:${id}`]);
    return;
  }
  await fs.rm(path.join(DATA_DIR, `${id}.json`), { force: true });
}

/** A doctor's walkthrough history, newest first. */
export async function listSessions(ownerId: string, limit = 50): Promise<SessionSummary[]> {
  const toSummary = (s: Session): SessionSummary => ({
    id: s.id,
    createdAt: s.createdAt,
    patientName: s.patientName,
    sentAt: s.sentAt,
    procedureName: s.plan.procedureName,
  });
  if (hasMongo()) {
    const docs = await (await sessionsCollection())
      .find({ ownerId }, { projection: { _id: 0, id: 1, createdAt: 1, patientName: 1, sentAt: 1, "plan.procedureName": 1 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d) => toSummary(d as Session));
  }
  if (redisEnabled()) return []; // history needs MongoDB; Redis only stores individual links
  try {
    const files = await fs.readdir(DATA_DIR);
    const all = await Promise.all(files.map(async (f) => JSON.parse(await fs.readFile(path.join(DATA_DIR, f), "utf8")) as Session));
    return all
      .filter((s) => s.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(toSummary);
  } catch {
    return [];
  }
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
