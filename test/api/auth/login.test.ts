// @ts-nocheck
const mockUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockRefreshToken = {
  findUnique: jest.fn(),
  updateMany: jest.fn(),
};

const mockPrisma = { user: mockUser, refreshToken: mockRefreshToken };

jest.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
jest.mock("server-only", () => {});

const nextResponseJson = jest.fn();
const nextResponseCookies = { set: jest.fn() };

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      nextResponseJson(body, init);
      return {
        body,
        status: init?.status,
        headers: new Map(),
        cookies: nextResponseCookies,
      };
    },
  },
}));

jest.mock("@/lib/auth/jwt", () => ({
  signJwt: jest.fn(() => "mock-jwt-token"),
  verifyJwt: jest.fn(() => ({ sub: "user_1", email: "test@example.com", roles: ["CUSTOMER"] })),
  REFRESH_TTL_MS: 2592000000,
}));

jest.mock("@/lib/auth/tokens", () => ({
  issueRefreshToken: jest.fn(async () => ({
    token: "mock-refresh-token",
    tokenHash: "hash",
    familyId: "family",
    expiresAt: new Date(Date.now() + 2592000000),
  })),
  revokeAllRefreshTokens: jest.fn(async () => {}),
}));

jest.mock("@/lib/auth/session", () => ({
  getCookieName: jest.fn(() => "hh_session"),
  getRefreshCookieName: jest.fn(() => "refresh"),
  setSessionCookie: jest.fn((res) => res),
  clearSessionCookie: jest.fn((res) => res),
}));

jest.mock("@/lib/auth/password", () => ({
  comparePassword: jest.fn(),
}));

jest.mock("@/lib/auth/verification", () => ({
  issueVerificationOtp: jest.fn(async () => {}),
}));

jest.mock("@/lib/security/rateLimit", () => ({
  rateLimit: jest.fn(async () => ({
    allowed: true,
    limit: 10,
    remaining: 9,
    retryAfterSeconds: 0,
  })),
  clearRateLimit: jest.fn(async () => {}),
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  requireUserId: jest.fn(async () => "user_1"),
  requireVerifiedUser: jest.fn(async () => "user_1"),
  AuthError: class extends Error {
    status = 401;
    code = "UNAUTHORIZED";
  },
}));

const { signJwt } = require("@/lib/auth/jwt");
const { issueRefreshToken } = require("@/lib/auth/tokens");
const { issueVerificationOtp } = require("@/lib/auth/verification");
const { setSessionCookie } = require("@/lib/auth/session");
const { comparePassword } = require("@/lib/auth/password");
const { rateLimit } = require("@/lib/security/rateLimit");
const { requireUserId, AuthError } = require("@/lib/auth/current-user");
const { POST: loginPost } = require("@/api/auth/login/route");
const { POST: logoutPost } = require("@/api/auth/logout/route");
const { GET: meGet } = require("@/api/auth/me/route");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    signJwt.mockClear();
    issueRefreshToken.mockClear();
    issueVerificationOtp.mockClear();
    comparePassword.mockReset();
    rateLimit.mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      retryAfterSeconds: 0,
    });
  });

  it("logs in a verified user with valid credentials", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      passwordHash: "$2a$12$hashedpassword",
      firstName: "Test",
      lastName: "User",
      roles: ["CUSTOMER"],
      emailVerifiedAt: new Date(),
    });
    comparePassword.mockResolvedValue(true);

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "Test@Example.com ",
        password: "SecurePass123!",
      }),
      headers: new Headers(),
    } as any;

    await loginPost(req);

    // Emails are normalized before lookup.
    expect(mockUser.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(signJwt).toHaveBeenCalledWith({
      sub: "user_1",
      email: "test@example.com",
      roles: ["CUSTOMER"],
    });
    expect(issueRefreshToken).toHaveBeenCalledWith(
      "user_1",
      undefined,
      expect.objectContaining({ ip: "127.0.0.1" }),
    );
    expect(setSessionCookie).toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        user: expect.objectContaining({
          email: "test@example.com",
          emailVerified: true,
        }),
      },
      undefined,
    );
    // Raw tokens must not be exposed in the response body.
    expect(nextResponseJson.mock.calls[0][0]).not.toHaveProperty("access_token");
    expect(nextResponseJson.mock.calls[0][0]).not.toHaveProperty("refresh_token");
  });

  it("blocks an unverified user and sends a fresh code", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      passwordHash: "$2a$12$hashedpassword",
      firstName: "Test",
      lastName: "User",
      roles: ["CUSTOMER"],
      emailVerifiedAt: null,
    });
    comparePassword.mockResolvedValue(true);

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "SecurePass123!",
      }),
      headers: new Headers(),
    } as any;

    await loginPost(req);

    expect(issueVerificationOtp).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_1" }),
    );
    expect(signJwt).not.toHaveBeenCalled();
    expect(setSessionCookie).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "EMAIL_NOT_VERIFIED",
        requiresVerification: true,
      }),
      { status: 403 },
    );
  });

  it("returns 401 for invalid credentials", async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "wrongpassword",
      }),
      headers: new Headers(),
    } as any;

    await loginPost(req);

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    rateLimit.mockResolvedValueOnce({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterSeconds: 900,
    });

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "SecurePass123!",
      }),
      headers: new Headers(),
    } as any;

    await loginPost(req);

    expect(mockUser.findUnique).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Too many login attempts. Please try again later." },
      expect.objectContaining({ status: 429 }),
    );
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    await logoutPost();
    expect(nextResponseJson).toHaveBeenCalledWith(
      { message: "Logged out successfully" },
      undefined,
    );
  });
});

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
  });

  it("returns current user when authenticated", async () => {
    requireUserId.mockResolvedValue("user_1");
    mockUser.findUnique.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      phone: null,
      roles: ["CUSTOMER"],
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await meGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          email: "test@example.com",
          emailVerified: true,
        }),
      }),
      undefined,
    );
  });

  it("returns 401 when not authenticated", async () => {
    const err = new AuthError();
    requireUserId.mockRejectedValue(err);

    await meGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Unauthorized" },
      { status: 401 },
    );
  });
});
