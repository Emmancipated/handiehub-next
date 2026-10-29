// @ts-nocheck
const mockSellerProfile = {
  findMany: jest.fn(),
};

const mockReview = {
  groupBy: jest.fn(),
};

const mockPrisma = {
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
      return { body, status: init?.status ?? 200, headers: new Map() };
    },
  },
}));

const { GET } = require("@/api/sellers/route");

const makeProfile = (overrides: any = {}) => ({
  id: "profile_1",
  userId: "seller_1",
  businessName: "Adebayo Plumbing",
  description: "Reliable plumbing services",
  avatarUrl: null,
  professions: ["Plumber"],
  skills: ["Pipe Repair"],
  city: "Lagos",
  state: "Lagos",
  country: "Nigeria",
  responseTime: "1 hour",
  isVerified: true,
  isFeatured: false,
  isTopSeller: false,
  onboardingCompletedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  user: {
    id: "seller_1",
    firstName: "Samuel",
    lastName: "Adebayo",
    createdAt: new Date("2025-12-01T00:00:00.000Z"),
    listings: [{ id: "listing_1", priceMinor: BigInt(500000) }],
  },
  ...overrides,
});

const request = (query = "") =>
  new Request(`http://localhost/api/sellers${query}`);

describe("GET /api/sellers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReview.groupBy.mockResolvedValue([]);
  });

  it("returns seller cards with rating stats and pagination", async () => {
    mockSellerProfile.findMany.mockResolvedValue([
      makeProfile(),
      makeProfile({
        id: "profile_2",
        userId: "seller_2",
        businessName: "Grace Interiors",
        professions: ["Carpenter", "Painter"],
        user: {
          id: "seller_2",
          firstName: "Grace",
          lastName: "Okafor",
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
          listings: [],
        },
      }),
    ]);
    mockReview.groupBy.mockResolvedValue([
      { sellerId: "seller_1", _avg: { rating: 4.75 }, _count: { _all: 8 } },
    ]);

    const res = await GET(request());

    expect(mockSellerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          onboardingCompletedAt: { not: null },
          user: { roles: { has: "SELLER" } },
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        sellers: expect.arrayContaining([
          expect.objectContaining({
            id: "seller_1",
            businessName: "Adebayo Plumbing",
            responseTimeLabel: "Within 1 hour",
            startingPriceMinor: "500000",
            stats: expect.objectContaining({
              listingCount: 1,
              reviewCount: 8,
              averageRating: 4.75,
            }),
          }),
          expect.objectContaining({
            id: "seller_2",
            stats: expect.objectContaining({
              listingCount: 0,
              reviewCount: 0,
              averageRating: null,
            }),
          }),
        ]),
        professions: ["Carpenter", "Painter", "Plumber"],
        pagination: { page: 1, limit: 12, total: 2, totalPages: 1 },
      }),
      undefined,
    );
  });

  it("applies search, profession, and verification filters", async () => {
    mockSellerProfile.findMany.mockResolvedValue([]);

    await GET(request("?q=plumb&profession=Plumber&verified=true&state=Lagos"));

    expect(mockSellerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          professions: { has: "Plumber" },
          state: "Lagos",
          isVerified: true,
          OR: expect.arrayContaining([
            { businessName: { contains: "plumb", mode: "insensitive" } },
            { professions: { has: "plumb" } },
          ]),
        }),
      }),
    );
  });

  it("sorts by rating then review count", async () => {
    mockSellerProfile.findMany.mockResolvedValue([
      makeProfile({
        id: "profile_1",
        userId: "seller_1",
        businessName: "Lower Rated",
        user: {
          id: "seller_1",
          firstName: "A",
          lastName: "One",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          listings: [],
        },
      }),
      makeProfile({
        id: "profile_2",
        userId: "seller_2",
        businessName: "Higher Rated",
        user: {
          id: "seller_2",
          firstName: "B",
          lastName: "Two",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          listings: [],
        },
      }),
    ]);
    mockReview.groupBy.mockResolvedValue([
      { sellerId: "seller_1", _avg: { rating: 4.1 }, _count: { _all: 3 } },
      { sellerId: "seller_2", _avg: { rating: 4.9 }, _count: { _all: 12 } },
    ]);

    const res = await GET(request("?sort=rating"));

    expect(res.body.sellers.map((seller: any) => seller.id)).toEqual([
      "seller_2",
      "seller_1",
    ]);
  });

  it("paginates the directory", async () => {
    mockSellerProfile.findMany.mockResolvedValue(
      Array.from({ length: 15 }).map((_, index) =>
        makeProfile({
          id: `profile_${index}`,
          userId: `seller_${index}`,
          businessName: `Seller ${String(index).padStart(2, "0")}`,
          user: {
            id: `seller_${index}`,
            firstName: "Test",
            lastName: `Seller ${index}`,
            createdAt: new Date(2026, 0, index + 1),
            listings: [],
          },
        }),
      ),
    );

    const res = await GET(request("?page=2&limit=10&sort=name"));

    expect(res.body.sellers).toHaveLength(5);
    expect(res.body.sellers[0].id).toBe("seller_10");
    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 15,
      totalPages: 2,
    });
  });

  it("rejects an out-of-range limit", async () => {
    const res = await GET(request("?limit=1000"));

    expect(res.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed" }),
      { status: 400 },
    );
  });
});
