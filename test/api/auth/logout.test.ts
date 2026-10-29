// @ts-nocheck
const mockCookieGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({ get: mockCookieGet })),
}));

const mockRefreshToken = { findUnique: jest.fn() };
jest.mock("@/lib/db/prisma", () => ({
  prisma: { refreshToken: mockRefreshToken },
}));
jest.mock("server-only", () => {});

const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      nextResponseJson(body, init);
      return { body, status: init?.status ?? 200, headers: new Map() };
    },
  },
}));

const mockRequireUserId = jest.fn();
jest.mock("@/lib/auth/current-user", () => ({
  requireUserId: (...args: any[]) => mockRequireUserId(...args),
}));

const mockRevokeAll = jest.fn(async () => {});
jest.mock("@/lib/auth/tokens", () => ({
  revokeAllRefreshTokens: (...args: any[]) => mockRevokeAll(...args),
}));

const mockClearSessionCookie = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getRefreshCookieName: jest.fn(() => "refresh"),
  clearSessionCookie: (...args: any[]) => mockClearSessionCookie(...args),
}));

jest.mock("@/lib/auth/otp", () => ({
  hashToken: jest.fn((token: string) => `hash:${token}`),
}));

const { POST: logoutPost } = require("@/api/auth/logout/route");

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockCookieGet.mockReturnValue(undefined);
    mockRequireUserId.mockResolvedValue("user_1");
  });

  it("revokes every refresh token and clears cookies for a signed-in user", async () => {
    await logoutPost();

    expect(mockRevokeAll).toHaveBeenCalledWith("user_1");
    expect(mockClearSessionCookie).toHaveBeenCalledWith(expect.anything());
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        message: "Logged out successfully",
      },
      undefined,
    );
  });

  it("falls back to the refresh cookie when the access token is expired", async () => {
    mockRequireUserId.mockRejectedValue(new Error("expired access token"));
    mockCookieGet.mockReturnValue({ value: "refresh-token" });
    mockRefreshToken.findUnique.mockResolvedValue({ userId: "user_2" });

    await logoutPost();

    expect(mockRefreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: "hash:refresh-token" },
      select: { userId: true },
    });
    expect(mockRevokeAll).toHaveBeenCalledWith("user_2");
    expect(mockClearSessionCookie).toHaveBeenCalled();
  });

  it("is idempotent when there is no session at all", async () => {
    mockRequireUserId.mockRejectedValue(new Error("no access token"));

    await logoutPost();

    expect(mockRevokeAll).not.toHaveBeenCalled();
    expect(mockClearSessionCookie).toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        message: "Logged out successfully",
      },
      undefined,
    );
  });
});
