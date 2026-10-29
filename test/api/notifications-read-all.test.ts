// @ts-nocheck
const mockNotification = {
  updateMany: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: { notification: mockNotification },
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

const { PATCH } = require("@/api/notifications/read-all/route");

describe("PATCH /api/notifications/read-all", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks every unread notification as read for the current user", async () => {
    mockNotification.updateMany.mockResolvedValue({ count: 4 });

    const res = await PATCH();

    expect(mockNotification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", isRead: false },
      data: { isRead: true, readAt: expect.any(Date) },
    });
    expect(res.body).toEqual({ updated: 4 });
  });
});
