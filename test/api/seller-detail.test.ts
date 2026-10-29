// @ts-nocheck
const mockUser = { findUnique: jest.fn() };
const mockReview = { aggregate: jest.fn() };
const mockListing = { count: jest.fn() };

jest.mock("@/lib/db/prisma", () => ({
  prisma: { user: mockUser, review: mockReview, listing: mockListing },
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

const { GET } = require("@/api/sellers/[id]/route");

const seller = {
  id: "seller_1",
  firstName: "Samuel",
  lastName: "Adebayo",
  roles: ["SELLER"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  sellerProfile: null,
  listings: [
    {
      id: "listing_1",
      slug: "pipe-repair",
      title: "Pipe Repair",
      description: "Fix pipes",
      kind: "SERVICE",
      priceMinor: BigInt(500000),
      currency: "NGN",
      images: [],
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      category: { id: "cat_1", name: "Plumbing", slug: "plumbing" },
    },
  ],
};

const callRoute = (id: string) =>
  GET(new Request(`http://localhost/api/sellers/${id}`), {
    params: Promise.resolve({ id }),
  });

describe("GET /api/sellers/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReview.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { _all: 0 },
    });
    mockListing.count.mockResolvedValue(0);
  });

  it("returns the public storefront with aggregate rating stats", async () => {
    mockUser.findUnique.mockResolvedValue(seller);
    mockReview.aggregate.mockResolvedValue({
      _avg: { rating: 4.666 },
      _count: { _all: 3 },
    });
    mockListing.count.mockResolvedValue(7);

    const res = await callRoute("seller_1");

    expect(res.status).toBe(200);
    expect(mockReview.aggregate).toHaveBeenCalledWith({
      where: { sellerId: "seller_1" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    expect(mockListing.count).toHaveBeenCalledWith({
      where: { sellerId: "seller_1", status: "ACTIVE" },
    });
    expect(res.body.seller).toEqual(
      expect.objectContaining({
        id: "seller_1",
        stats: {
          listingCount: 7,
          reviewCount: 3,
          averageRating: 4.67,
        },
      }),
    );
    expect(res.body.seller.listings[0].priceMinor).toBe("500000");
  });

  it("returns null average when there are no reviews", async () => {
    mockUser.findUnique.mockResolvedValue(seller);

    const res = await callRoute("seller_1");

    expect(res.body.seller.stats).toEqual({
      listingCount: 0,
      reviewCount: 0,
      averageRating: null,
    });
  });

  it("returns standard response-time and delivery labels", async () => {
    mockUser.findUnique.mockResolvedValue({
      ...seller,
      sellerProfile: {
        id: "profile_1",
        userId: "seller_1",
        businessName: "Adebayo Plumbing",
        description: null,
        phoneNumber: "+2348012345678",
        country: "NG",
        state: "Lagos",
        city: "Ikeja",
        address: "1 Test Street",
        avatarUrl: null,
        professions: ["Plumbing"],
        skills: ["Pipe repair"],
        productsImageUrl: [],
        responseTime: "WITHIN_2_HOURS",
        intraStateDeliveryMinMinutes: 120,
        intraStateDeliveryMaxMinutes: 240,
        interStateDeliveryMinMinutes: 1440,
        interStateDeliveryMaxMinutes: 2880,
        isVerified: true,
        isFeatured: false,
        isTopSeller: false,
        verifiedAt: null,
        onboardingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const res = await callRoute("seller_1");

    expect(res.body.seller.profile).toEqual(
      expect.objectContaining({
        responseTime: "WITHIN_2_HOURS",
        responseTimeLabel: "Within 2 hours",
        intraStateDelivery: {
          minMinutes: 120,
          maxMinutes: 240,
          label: "2–4 hours",
        },
        interStateDelivery: {
          minMinutes: 1440,
          maxMinutes: 2880,
          label: "1–2 days",
        },
      }),
    );
  });

  it("404s for missing users and non-sellers", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    let res = await callRoute("missing");
    expect(res.status).toBe(404);

    mockUser.findUnique.mockResolvedValue({ ...seller, roles: ["CUSTOMER"] });
    res = await callRoute("seller_1");
    expect(res.status).toBe(404);
  });
});
