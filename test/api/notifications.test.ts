// @ts-nocheck
const mockNotification = {
  findMany: jest.fn(),
  count: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: { notification: mockNotification },
}));
jest.mock("server-only", () => {});

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      body,
      status: init?.status ?? 200,
      headers: new Map(),
    }),
  },
}));

jest.mock("@/lib/auth/current-user", () => {
  class AuthError extends Error {
    status = 401;
    code = "UNAUTHORIZED";
    constructor() {
      super("Unauthorized");
      this.name = "AuthError";
    }
  }
  return {
    requireUserId: jest.fn(() => Promise.resolve("user_1")),
    AuthError,
  };
});

const { GET } = require("@/api/notifications/route");

describe("GET /api/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotification.findMany.mockResolvedValue([]);
    mockNotification.count.mockResolvedValue(0);
  });

  it("parses ?isRead=false as a false filter", async () => {
    await GET(new Request("http://localhost/api/notifications?isRead=false"));

    expect(mockNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1", isRead: false },
      }),
    );
  });

  it("omits the read filter when isRead is absent", async () => {
    await GET(new Request("http://localhost/api/notifications"));

    expect(mockNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });

  it("rejects an invalid isRead value", async () => {
    const res = await GET(
      new Request("http://localhost/api/notifications?isRead=maybe"),
    );

    expect(res.status).toBe(400);
  });
});
