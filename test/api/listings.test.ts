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

const mockSellerProfile = {
  findUnique: jest.fn(),
};

const mockReview = {
  groupBy: jest.fn(),
};

const mockPrisma = {
  listing: mockListing,
  user: mockUser,
  category: mockCategory,
  sellerProfile: mockSellerProfile,
  review: mockReview,
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
  getOptionalUserId: jest.fn(() => Promise.resolve("user_1")),
  getOptionalUser: jest.fn(() => Promise.resolve({ sub: "user_1" })),
  requireVerifiedUser: jest.fn(() => Promise.resolve("user_1")),
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
    mockReview.groupBy.mockResolvedValue([]);
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

  it("serves the feed to anonymous visitors", async () => {
    const { getOptionalUserId } = require("@/lib/auth/current-user");
    getOptionalUserId.mockResolvedValueOnce(null);
    mockListing.findMany.mockResolvedValue([]);
    mockListing.count.mockResolvedValue(0);

    const req = { url: "http://localhost/api/listings" } as any;
    await listingsGet(req);

    expect(mockListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        listings: [],
        pagination: expect.objectContaining({ page: 1, total: 0 }),
      }),
      undefined,
    );
  });

  it("applies a sort clause to the feed", async () => {
    mockListing.findMany.mockResolvedValue([]);
    mockListing.count.mockResolvedValue(0);

    const req = {
      url: "http://localhost/api/listings?sort=price-asc",
    } as any;
    await listingsGet(req);

    expect(mockListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { priceMinor: "asc" } }),
    );
  });
});

describe("POST /api/listings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockSellerProfile.findUnique.mockResolvedValue({
      businessName: "Fixit Ltd",
      phoneNumber: "+2348000000000",
      country: "NG",
      state: "Lagos",
      city: "Ikeja",
      address: "1 Test Street",
      professions: ["Plumbing"],
      skills: ["Pipe repair"],
    });
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

  it("blocks a seller with an incomplete profile", async () => {
    mockUser.findUnique.mockResolvedValue({ id: "user_1", roles: ["SELLER"] });
    mockSellerProfile.findUnique.mockResolvedValue(null);

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

    expect(mockListing.create).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SELLER_PROFILE_INCOMPLETE" }),
      { status: 403 },
    );
  });
});
