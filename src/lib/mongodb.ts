import { MongoClient, type Binary, type Collection } from "mongodb";
import type { Session } from "./types";

export interface User {
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
  loginCount: number;
  source: string;
}

// Reuse one client across requests (and across hot reloads in dev).
const globalForMongo = globalThis as unknown as {
  _opero_mongo?: Promise<MongoClient>;
  _opero_indexed?: Promise<string>;
  _opero_sessions_indexed?: Promise<unknown>;
  _opero_voices_indexed?: Promise<unknown>;
};

export const hasMongo = () => Boolean(process.env.MONGODB_URI);

function client() {
  globalForMongo._opero_mongo ??= new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 5000 })
    .connect()
    .catch((err) => {
      // Don't cache a failed connection: retry on the next request (e.g. once MongoDB is started).
      globalForMongo._opero_mongo = undefined;
      globalForMongo._opero_indexed = undefined;
      throw err;
    });
  return globalForMongo._opero_mongo;
}

export async function users(): Promise<Collection<User>> {
  const db = (await client()).db(process.env.MONGODB_DB ?? "opero");
  const col = db.collection<User>(process.env.MONGODB_COLLECTION ?? "users");
  // One document per email, enforced by the database.
  globalForMongo._opero_indexed ??= col.createIndex({ email: 1 }, { unique: true }).catch((err) => {
    globalForMongo._opero_indexed = undefined;
    throw err;
  });
  await globalForMongo._opero_indexed;
  return col;
}

/** Walkthroughs (notes → plan, images, delivery). Stored next to users in the same database. */
export async function sessionsCollection(): Promise<Collection<Session>> {
  const db = (await client()).db(process.env.MONGODB_DB ?? "opero");
  const col = db.collection<Session>(process.env.MONGODB_SESSIONS_COLLECTION ?? "walkthroughs");
  globalForMongo._opero_sessions_indexed ??= Promise.all([
    col.createIndex({ id: 1 }, { unique: true }),
    col.createIndex({ ownerId: 1, createdAt: -1 }),
  ]).catch((err) => {
    globalForMongo._opero_sessions_indexed = undefined;
    throw err;
  });
  await globalForMongo._opero_sessions_indexed;
  return col;
}

/** Cached narration clips (one per text + language + voice), so each is only generated once. */
export async function voicesCollection(): Promise<Collection<{ key: string; audio: Binary; createdAt: Date }>> {
  const db = (await client()).db(process.env.MONGODB_DB ?? "opero");
  const col = db.collection<{ key: string; audio: Binary; createdAt: Date }>("voices");
  globalForMongo._opero_voices_indexed ??= col.createIndex({ key: 1 }, { unique: true }).catch((err) => {
    globalForMongo._opero_voices_indexed = undefined;
    throw err;
  });
  await globalForMongo._opero_voices_indexed;
  return col;
}
