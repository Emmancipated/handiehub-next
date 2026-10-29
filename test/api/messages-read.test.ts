// @ts-nocheck
const mockMessage = {
  updateMany: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: { message: mockMessage },
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

const { PATCH } = require("@/api/messages/read/route");

describe("PATCH /api/messages/read", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks only the caller's unread messages in the conversation", async () => {
    mockMessage.updateMany.mockResolvedValue({ count: 2 });

    const req = new Request("http://localhost/api/messages/read", {
      method: "PATCH",
      body: JSON.stringify({ conversationId: "dm_a_b" }),
    });

    const res = await PATCH(req);

    expect(mockMessage.updateMany).toHaveBeenCalledWith({
      where: {
        conversationId: "dm_a_b",
        recipientId: "user_1",
        isRead: false,
      },
      data: { isRead: true, readAt: expect.any(Date) },
    });
    expect(res.body).toEqual({ updated: 2 });
    expect(res.status).toBe(200);
  });

  it("rejects a request without a conversation id", async () => {
    const req = new Request("http://localhost/api/messages/read", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(400);
    expect(mockMessage.updateMany).not.toHaveBeenCalled();
  });
});
