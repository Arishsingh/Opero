import { describe, expect, it, vi } from "vitest";
import { isValidEmail, normalizeEmail } from "@/lib/email";

// Route handlers import next/headers indirectly; stub it so they run outside Next.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

const post = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("email validation", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeEmail("  Doc@Hospital.ORG ")).toBe("doc@hospital.org");
  });

  it.each(["doc@hospital.org", "a.b+c@clinic.co.uk"])("accepts %s", (e) => expect(isValidEmail(e)).toBe(true));

  it.each(["", "not-an-email", "a@b", "a @b.com", `${"x".repeat(250)}@a.com`])("rejects %j", (e) =>
    expect(isValidEmail(e)).toBe(false)
  );
});

describe("POST /api/signup", () => {
  it("rejects an invalid email with 400", async () => {
    const { POST } = await import("@/app/api/signup/route");
    const res = await POST(post({ email: "nope" }));
    expect(res.status).toBe(400);
  });

  it("explains when MongoDB isn't configured (503)", async () => {
    const saved = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    const { POST } = await import("@/app/api/signup/route");
    const res = await POST(post({ email: "doc@hospital.org" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/MONGODB_URI/);
    if (saved) process.env.MONGODB_URI = saved;
  });
});

describe("POST /api/generate", () => {
  it("rejects notes that are too short", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const res = await POST(post({ notes: "short" }));
    expect(res.status).toBe(400);
  });

  it("rejects notes over 20,000 characters", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const res = await POST(post({ notes: "x".repeat(20_001) }));
    expect(res.status).toBe(400);
  });
});
