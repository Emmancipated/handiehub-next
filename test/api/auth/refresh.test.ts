// @ts-nocheck
const mockCookieGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({ get: mockCookieGet })),
}));

const mockRefreshToken = {
  findUnique: jest.fn(),
  delete: jest.fn(),
};

const mockPrisma = { refreshToken: mockRefreshToken };

jest.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
jest.mock("server-only", () => {});

const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      nextResponseJson(body, init);
      return {
        body,
        status: init?.status ?? 200,
        headers: new Map(),
      };
    },
  },
}));

const mockSignJwt = jest.fn(() => "access-token");

jest.mock("@/lib/auth/jwt", () => ({
  signJwt: (...args: any[]) => mockSignJwt(...args),
  REFRESH_TTL_MS: 30 * 24 * 60 * 60 * 1000,
}));

const mockSetSessionCookie = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getRefreshCookieName: jest.fn(() => "refresh"),
  setSessionCookie: (...args: any[]) => mockSetSessionCookie(...args),
}));

jest.mock("@/lib/auth/otp", () => ({
  hashToken: jest.fn((token: string) => `hash:${token}`),
}));

const mockRotate = jest.fn();
const mockRevokeFamily = jest.fn(async () => {});
const mockPrune = jest.fn(async () => {});

jest.mock("@/lib/auth/tokens", () => ({
  rotateRefreshToken: (...args: any[]) => mockRotate(...args),
  revokeRefreshFamily: (...args: any[]) => mockRevokeFamily(...args),
  pruneExpiredRefreshTokens: (...args: any[]) => mockPrune(...args),
}));

const { POST: refreshPost } = require("@/api/auth/refresh/route");

const FUTURE = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

const makeStored = (overrides: Record<string, any> = {}) => ({
  id: "rt_1",
  userId: "user_1",
  tokenHash: "hash:token-1",
  familyId: "family_1",
  revokedAt: null,
  expiresAt: FUTURE(),
  user: {
    id: "user_1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    roles: ["CUSTOMER"],
    emailVerifiedAt: new Date(),
  },
  ...overrides,
});

const makeRequest = (body: Record<string, any> = {}) =>
  ({
    json: jest.fn().mockResolvedValue(body),
    headers: { get: jest.fn(() => "jest-agent") },
  }) as any;

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockCookieGet.mockReturnValue({ value: "token-1" });
    mockRotate.mockResolvedValue({
      token: "token-2",
      tokenHash: "hash:token-2",
      familyId: "family_1",
      expiresAt: FUTURE(),
    });
  });

  it("rejects a request with no refresh token", async () => {
    mockCookieGet.mockReturnValue(undefined);

    await refreshPost(makeRequest());

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "REFRESH_TOKEN_MISSING" }),
      { status: 401 },
    );
    expect(mockRotate).not.toHaveBeenCalled();
  });

  it("rejects an unknown refresh token", async () => {
    mockRefreshToken.findUnique.mockResolvedValue(null);

    await refreshPost(makeRequest());

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "INVALID_REFRESH_TOKEN" }),
      { status: 401 },
    );
  });

  it("rotates a valid token and sets fresh cookies", async () => {
    const stored = makeStored();
    mockRefreshToken.findUnique.mockResolvedValue(stored);

    await refreshPost(makeRequest());

    expect(mockRotate).toHaveBeenCalledWith(
      stored,
      expect.objectContaining({ userAgent: "jest-agent" }),
    );
    expect(mockSignJwt).toHaveBeenCalledWith({
      sub: "user_1",
      email: "test@example.com",
      roles: ["CUSTOMER"],
    });
    expect(mockSetSessionCookie).toHaveBeenCalledWith(
      expect.anything(),
      "access-token",
      "token-2",
      expect.any(Date),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          id: "user_1",
          emailVerified: true,
        }),
      }),
      undefined,
    );
    expect(mockPrune).toHaveBeenCalled();
  });

  it("revokes the family when a rotated token is reused after the grace window", async () => {
    mockRefreshToken.findUnique.mockResolvedValue(
      makeStored({ revokedAt: new Date(Date.now() - 60_000) }),
    );

    await refreshPost(makeRequest());

    expect(mockRevokeFamily).toHaveBeenCalledWith("family_1");
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "REFRESH_TOKEN_REUSED" }),
      { status: 401 },
    );
    expect(mockRotate).not.toHaveBeenCalled();
  });

  it("returns a retryable error during the cross-tab grace window", async () => {
    mockRefreshToken.findUnique.mockResolvedValue(
      makeStored({ revokedAt: new Date() }),
    );

    await refreshPost(makeRequest());

    expect(mockRevokeFamily).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "REFRESH_IN_PROGRESS" }),
      { status: 401 },
    );
  });

  it("deletes an expired refresh token", async () => {
    mockRefreshToken.findUnique.mockResolvedValue(
      makeStored({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await refreshPost(makeRequest());

    expect(mockRefreshToken.delete).toHaveBeenCalledWith({
      where: { id: "rt_1" },
    });
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "REFRESH_TOKEN_EXPIRED" }),
      { status: 401 },
    );
  });

  it("blocks refresh for an unverified account and revokes its family", async () => {
    mockRefreshToken.findUnique.mockResolvedValue(
      makeStored({
        user: {
          id: "user_1",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          roles: ["CUSTOMER"],
          emailVerifiedAt: null,
        },
      }),
    );

    await refreshPost(makeRequest());

    expect(mockRevokeFamily).toHaveBeenCalledWith("family_1");
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "EMAIL_NOT_VERIFIED" }),
      { status: 403 },
    );
  });

  it("accepts the refresh token from the request body as a fallback", async () => {
    mockCookieGet.mockReturnValue(undefined);
    mockRefreshToken.findUnique.mockResolvedValue(makeStored());

    await refreshPost(makeRequest({ refreshToken: "token-1" }));

    expect(mockRefreshToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: "hash:token-1" },
      }),
    );
    expect(mockRotate).toHaveBeenCalled();
  });
});
