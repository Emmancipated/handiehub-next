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

jest.mock("@/lib/auth/password", () => ({
  ...jest.requireActual("@/lib/auth/password"),
  hashPassword: jest.fn(async () => "$2a$12$hashedpassword"),
}));

jest.mock("@/lib/email/sendOtpEmail", () => ({
  sendOtpEmail: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("@/lib/security/rateLimit", () => ({
  rateLimit: jest.fn(async () => ({
    allowed: true,
    limit: 5,
    remaining: 4,
    retryAfterSeconds: 0,
  })),
  clearRateLimit: jest.fn(async () => {}),
  getClientIp: jest.fn(() => "127.0.0.1"),
}));

const { POST: signupPost } = require("@/api/auth/signup/route");
const { hashPassword } = require("@/lib/auth/password");
const { rateLimit } = require("@/lib/security/rateLimit");

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
  } as any;
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    hashPassword.mockClear();
    rateLimit.mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      retryAfterSeconds: 0,
    });
  });

  it("creates a customer without issuing a session", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      roles: ["CUSTOMER"],
    });
    mockUser.update.mockResolvedValue({});

    await signupPost(
      makeRequest({
        email: " Test@Example.com ",
        password: "SecurePass123!",
        firstName: "Test",
        lastName: "User",
      }),
    );

    // Emails are normalized before the uniqueness check and insert.
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
    // The OTP is persisted before responding.
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({
          otpHash: expect.any(String),
          otpExpiresAt: expect.any(Date),
        }),
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: "test@example.com" }),
        requiresVerification: true,
      }),
      expect.objectContaining({ status: 201 }),
    );
    // No session/tokens at signup.
    expect(nextResponseJson.mock.calls[0][0]).not.toHaveProperty(
      "access_token",
    );
    expect(nextResponseCookies.set).not.toHaveBeenCalled();
  });

  it("creates a seller when the account type is seller", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockResolvedValue({
      id: "user_2",
      email: "seller@example.com",
      firstName: "Sell",
      lastName: "Er",
      roles: ["SELLER"],
    });
    mockUser.update.mockResolvedValue({});

    await signupPost(
      makeRequest({
        email: "seller@example.com",
        password: "SecurePass123!",
        firstName: "Sell",
        lastName: "Er",
        accountType: "seller",
      }),
    );

    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ roles: ["SELLER"] }),
      }),
    );
  });

  it("returns 409 if email already exists", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
    });

    await signupPost(
      makeRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "Test",
        lastName: "User",
      }),
    );

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Email already registered" },
      { status: 409 },
    );
  });

  it("returns 400 for validation errors (including weak passwords)", async () => {
    mockUser.findUnique.mockResolvedValue(null);

    await signupPost(
      makeRequest({
        email: "not-an-email",
        password: "short",
        firstName: "",
        lastName: "",
      }),
    );

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed" }),
      expect.objectContaining({ status: 400 }),
    );
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    rateLimit.mockResolvedValueOnce({
      allowed: false,
      limit: 5,
      remaining: 0,
      retryAfterSeconds: 900,
    });

    await signupPost(
      makeRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "Test",
        lastName: "User",
      }),
    );

    expect(mockUser.findUnique).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Too many signup attempts. Please try again later." },
      expect.objectContaining({ status: 429 }),
    );
  });
});
