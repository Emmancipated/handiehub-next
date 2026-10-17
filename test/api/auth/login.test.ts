// @ts-nocheck
const mockUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};

const mockPrisma = { user: mockUser };

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
  REFRESH_TTL_MS: 604800000,
}));

jest.mock("@/lib/auth/session", () => ({
  buildSessionCookie: jest.fn(() => "hh_session=mock-jwt-token; Path=/; HttpOnly; SameSite=Lax"),
  buildClearCookie: jest.fn(() => "hh_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"),
  getCookieName: jest.fn(() => "hh_session"),
  setSessionCookie: jest.fn((res) => res),
}));

jest.mock("@/lib/auth/password", () => ({
  comparePassword: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({ get: jest.fn() })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  requireUserId: jest.fn(),
  AuthError: class extends Error {
    status = 401;
  },
}));

const { signJwt } = require("@/lib/auth/jwt");
const { requireUserId, AuthError } = require("@/lib/auth/current-user");
const { POST: loginPost } = require("@/api/auth/login/route");
const { POST: logoutPost } = require("@/api/auth/logout/route");
const { GET: meGet } = require("@/api/auth/me/route");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    signJwt.mockClear();
    requireUserId.mockClear();
  });

  it("logs in a user with valid credentials", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      passwordHash: "$2a$12$hashedpassword",
      firstName: "Test",
      lastName: "User",
      roles: ["CUSTOMER"],
      emailVerifiedAt: null,
    });

    const { comparePassword } = require("@/lib/auth/password");
    comparePassword.mockResolvedValue(true);

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "SecurePass123!",
      }),
    } as any;

    await loginPost(req);

    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    expect(signJwt).toHaveBeenCalledWith(
      { sub: "user_1", email: "test@example.com", roles: ["CUSTOMER"] },
      "7d",
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: "test@example.com" }),
        access_token: "mock-jwt-token",
      }),
      undefined,
    );
  });

  it("returns 401 for invalid credentials", async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    } as any;

    await loginPost(req);

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const req = {} as any;
    await logoutPost(req);
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
    const { cookies } = require("next/headers");
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: "mock-token" }) });

    mockUser.findUnique.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      phone: null,
      roles: ["CUSTOMER"],
      emailVerifiedAt: null,
      createdAt: new Date(),
    });

    await meGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: "test@example.com" }),
      }),
      undefined,
    );
  });

  it("returns 401 when not authenticated", async () => {
    const { cookies } = require("next/headers");
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: undefined }) });

    const { verifyJwt } = require("@/lib/auth/jwt");
    verifyJwt.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const err = new AuthError();
    requireUserId.mockRejectedValue(err);

    await meGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Unauthorized" },
      { status: 401 },
    );
  });
});