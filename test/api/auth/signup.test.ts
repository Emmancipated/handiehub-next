// @ts-nocheck
const mockUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
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
  REFRESH_TTL_MS: 604800000,
}));

jest.mock("@/lib/auth/session", () => ({
  buildSessionCookie: jest.fn(() => "hh_session=mock-jwt-token; Path=/; HttpOnly; SameSite=Lax"),
  setSessionCookie: jest.fn((res) => res),
}));

jest.mock("@/lib/auth/password", () => ({
  hashPassword: jest.fn(() => "$2a$12$hashedpassword"),
}));

jest.mock("@/lib/email/sendOtpEmail", () => ({
  sendOtpEmail: jest.fn(() => Promise.resolve(true)),
}));

const { signJwt } = require("@/lib/auth/jwt");
const { POST: signupPost } = require("@/api/auth/signup/route");

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    signJwt.mockClear();
  });

  it("creates a user and returns 201", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      roles: ["CUSTOMER"],
    });
    mockUser.update.mockResolvedValue({});

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "Test",
        lastName: "User",
      }),
    } as any;

    await signupPost(req);

    expect(mockUser.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          roles: ["CUSTOMER"],
        }),
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: "test@example.com" }),
        access_token: "mock-jwt-token",
      }),
      expect.objectContaining({ status: 201 }),
    );
    expect(signJwt).toHaveBeenCalledWith(
      { sub: "user_1", email: "test@example.com", roles: ["CUSTOMER"] },
      "7d",
    );
  });

  it("returns 409 if email already exists", async () => {
    mockUser.findUnique.mockResolvedValue({ id: "user_1", email: "test@example.com" });

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "Test",
        lastName: "User",
      }),
    } as any;

    await signupPost(req);

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Email already registered" },
      { status: 409 },
    );
  });

  it("returns 400 for validation errors", async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const req = {
      json: jest.fn().mockResolvedValue({
        email: "not-an-email",
        password: "short",
        firstName: "",
        lastName: "",
      }),
    } as any;

    await signupPost(req);

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed" }),
      expect.objectContaining({ status: 400 }),
    );
  });
});