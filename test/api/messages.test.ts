// @ts-nocheck
const mockMessage = {
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({ prisma: { message: mockMessage } }));
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

jest.mock("@/lib/auth/current-user", () => ({
  requireUserId: jest.fn(() => Promise.resolve("user_1")),
  requireVerifiedUser: jest.fn(() => Promise.resolve("user_1")),
  AuthError: class extends Error {
    status = 401;
    code = "UNAUTHORIZED";
    constructor() {
      super("Unauthorized");
      this.name = "AuthError";
    }
  },
}));

const { GET } = require("@/api/messages/route");

describe("GET /api/messages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessage.findMany.mockResolvedValue([]);
    mockMessage.count.mockResolvedValue(0);
  });

  it("paginates from page 1 when page is omitted", async () => {
    const res = await GET(new Request("http://localhost/api/messages?limit=100"));

    expect(res.status).toBe(200);
    expect(mockMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ senderId: "user_1" }, { recipientId: "user_1" }] },
        skip: 0,
        take: 100,
      }),
    );
  });

  it("filters by conversationId when provided", async () => {
    await GET(new Request("http://localhost/api/messages?conversationId=conv_1"));

    expect(mockMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ conversationId: "conv_1" }),
      }),
    );
  });
});
