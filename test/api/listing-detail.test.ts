// @ts-nocheck
const mockListing = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
const mockUser = { findUnique: jest.fn() };
const mockReview = { groupBy: jest.fn() };

jest.mock("@/lib/db/prisma", () => ({
  prisma: { listing: mockListing, user: mockUser, review: mockReview },
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

const mockGetOptionalUserId = jest.fn();
const mockRequireVerifiedUser = jest.fn();

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
    getOptionalUserId: (...args: any[]) => mockGetOptionalUserId(...args),
    requireVerifiedUser: (...args: any[]) => mockRequireVerifiedUser(...args),
    AuthError,
  };
});

const { GET: listingGet } = require("@/api/listings/[id]/route");

const activeListing = {
  id: "listing_1",
  slug: "ambience-black-chair",
  title: "Ambience Black Chair",
  status: "ACTIVE",
  sellerId: "seller_1",
  priceMinor: BigInt(24999),
  category: { id: "cat_1", name: "Furniture", slug: "furniture" },
  seller: { id: "seller_1", firstName: "Ambi", lastName: "Furniture" },
};

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/listings/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockGetOptionalUserId.mockResolvedValue(null);
    mockReview.groupBy.mockResolvedValue([]);
  });

  it("resolves a listing by slug for anonymous visitors", async () => {
    mockListing.findFirst.mockResolvedValue(activeListing);

    await listingGet({} as any, params("ambience-black-chair"));

    expect(mockListing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { id: "ambience-black-chair" },
            { slug: "ambience-black-chair" },
          ],
        },
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: expect.objectContaining({
          id: "listing_1",
          priceMinor: "24999",
          ratingAvg: 0,
          reviewCount: 0,
        }),
      }),
      undefined,
    );
  });

  it("attaches aggregate review ratings", async () => {
    mockListing.findFirst.mockResolvedValue(activeListing);
    mockReview.groupBy.mockResolvedValue([
      { listingId: "listing_1", _avg: { rating: 4.5 }, _count: { _all: 2 } },
    ]);

    await listingGet({} as any, params("listing_1"));

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: expect.objectContaining({ ratingAvg: 4.5, reviewCount: 2 }),
      }),
      undefined,
    );
  });

  it("returns 404 for an unknown listing", async () => {
    mockListing.findFirst.mockResolvedValue(null);

    await listingGet({} as any, params("missing"));

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Listing not found" },
      { status: 404 },
    );
  });

  it("hides drafts from anonymous visitors", async () => {
    mockListing.findFirst.mockResolvedValue({ ...activeListing, status: "DRAFT" });

    await listingGet({} as any, params("listing_1"));

    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Listing not found" },
      { status: 404 },
    );
  });

  it("shows a draft to its owner", async () => {
    mockGetOptionalUserId.mockResolvedValue("seller_1");
    mockListing.findFirst.mockResolvedValue({ ...activeListing, status: "DRAFT" });

    await listingGet({} as any, params("listing_1"));

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: expect.objectContaining({ status: "DRAFT" }),
      }),
      undefined,
    );
  });
});
