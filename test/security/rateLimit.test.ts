// @ts-nocheck
const queryRaw = jest.fn();
const executeRaw = jest.fn();

jest.mock("@/lib/db/prisma", () => ({
  prisma: { $queryRaw: queryRaw, $executeRaw: executeRaw },
}));
jest.mock("server-only", () => {});

const { rateLimit, clearRateLimit, getClientIp } = require("@/lib/security/rateLimit");

describe("rateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Keep the opportunistic cleanup branch (Math.random() < 0.02) disabled.
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("allows requests at or under the limit", async () => {
    queryRaw.mockResolvedValue([
      { count: 3, expiresAt: new Date(Date.now() + 60_000) },
    ]);

    const res = await rateLimit("some:key", { limit: 5, windowMs: 60_000 });

    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(2);
    expect(res.retryAfterSeconds).toBe(0);
  });

  it("blocks requests over the limit and reports the retry delay", async () => {
    queryRaw.mockResolvedValue([
      { count: 6, expiresAt: new Date(Date.now() + 30_000) },
    ]);

    const res = await rateLimit("some:key", { limit: 5, windowMs: 60_000 });

    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("clears a specific key", async () => {
    executeRaw.mockResolvedValue(1);

    await clearRateLimit("some:key");

    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("returns null when no IP headers are present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBeNull();
  });
});
