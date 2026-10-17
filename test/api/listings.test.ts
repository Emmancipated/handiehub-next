// @ts-nocheck
const mockListing = {
  findMany: jest.fn(),
  count: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockUser = {
  findUnique: jest.fn(),
};

const mockCategory = {
  findUnique: jest.fn(),
};

const mockPrisma = {
  listing: mockListing,
  user: mockUser,
  category: mockCategory,
};

jest.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
jest.mock("server-only", () => {});

const nextResponseJson = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      nextResponseJson(body, init);
      return { body, status: init?.status, headers: new Map() };
    },
  },
}));

jest.mock("@/lib/auth/current-user", () => ({
  requireUserId: jest.fn(() => Promise.resolve("user_1")),
  AuthError: class extends Error {
    status = 401;
  },
}));

const { GET: listingsGet, POST: listingsPost } = require("@/api/listings/route");

describe("GET /api/listings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockUser.findUnique.mockResolvedValue({ id: "user_1", roles: ["CUSTOMER"] });
  });

  it("returns active listings with pagination", async () => {
    mockUser.findUnique.mockResolvedValue({ id: "user_1", roles: ["CUSTOMER"] });
    mockListing.findMany.mockResolvedValue([
      { id: "listing_1", title: "Test Product", status: "ACTIVE", priceMinor: BigInt(5000) },
    ]);
    mockListing.count.mockResolvedValue(1);

    const req = {
      url: "http://localhost/api/listings?page=1&limit=20",
    } as any;

    await listingsGet(req);

    expect(mockListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
        skip: 0,
        take: 20,
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        listings: expect.any(Array),
        pagination: expect.objectContaining({ page: 1, limit: 20, total: 1 }),
      }),
      undefined,
    );
  });
});

describe("POST /api/listings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
  });

  it("creates a listing for a seller", async () => {
    mockUser.findUnique.mockResolvedValue({ id: "user_1", roles: ["SELLER"] });
    mockCategory.findUnique.mockResolvedValue({ id: "cat_1", name: "Electronics" });
    mockListing.create.mockResolvedValue({
      id: "listing_1",
      title: "Test Product",
      slug: "test-product",
      status: "DRAFT",
      priceMinor: BigInt(5000),
    });

    const req = {
      json: jest.fn().mockResolvedValue({
        title: "Test Product",
        description: "A test product",
        categoryId: "cat_1",
        kind: "PRODUCT",
        priceMinor: "5000",
        currency: "NGN",
        images: [],
      }),
    } as any;

    await listingsPost(req);

    expect(mockListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Test Product",
          slug: expect.any(String),
          status: "DRAFT",
          sellerId: "user_1",
        }),
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ listing: expect.any(Object) }),
      { status: 201 },
    );
  });

  it("returns 403 for non-sellers", async () => {
    mockUser.findUnique.mockResolvedValue({ id: "user_1", roles: ["CUSTOMER"] });

    const req = {
      json: jest.fn().mockResolvedValue({
        title: "Test Product",
        description: "A test product",
        categoryId: "cat_1",
        kind: "PRODUCT",
        priceMinor: "5000",
      }),
    } as any;

    await listingsPost(req);

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Only registered sellers can create listings" },
      { status: 403 },
    );
  });
});
