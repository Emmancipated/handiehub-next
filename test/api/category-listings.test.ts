// @ts-nocheck
const mockCategory = {
  findUnique: jest.fn(),
};
const mockListing = {
  findMany: jest.fn(),
  count: jest.fn(),
};
const mockReview = {
  groupBy: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: { category: mockCategory, listing: mockListing, review: mockReview },
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

const { GET } = require("@/api/listings/category/[category]/route");

const listing = (id: string, categoryId: string) => ({
  id,
  slug: id,
  title: id,
  priceMinor: BigInt(1000),
  currency: "NGN",
  kind: "PRODUCT",
  images: [],
  categoryId,
  category: { id: categoryId, name: categoryId, slug: categoryId },
  seller: { id: "seller_1", firstName: "Ada", lastName: "Obi" },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});

const call = (slug: string) =>
  GET(new Request(`http://localhost/api/listings/category/${slug}`), {
    params: Promise.resolve({ category: slug }),
  });

describe("GET /api/listings/category/[category]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReview.groupBy.mockResolvedValue([]);
    mockListing.findMany.mockResolvedValue([]);
    mockListing.count.mockResolvedValue(0);
  });

  it("includes listings from a parent's subcategories", async () => {
    mockCategory.findUnique.mockResolvedValue({
      id: "home_kitchen",
      slug: "home_kitchen",
      name: "Home & Kitchen",
      parentId: null,
      parent: null,
      children: [
        {
          id: "home_kitchen_furniture",
          slug: "home_kitchen_furniture",
          name: "Furniture",
        },
      ],
    });
    mockListing.findMany.mockResolvedValue([
      listing("parent-listing", "home_kitchen"),
      listing("child-listing", "home_kitchen_furniture"),
    ]);
    mockListing.count.mockResolvedValue(2);

    const res = await call("home_kitchen");

    expect(mockListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: {
            in: ["home_kitchen", "home_kitchen_furniture"],
          },
          status: "ACTIVE",
        },
      }),
    );
    expect(res.body.category.children).toHaveLength(1);
    expect(res.body.listings).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it("returns 404 for an unknown category", async () => {
    mockCategory.findUnique.mockResolvedValue(null);

    const res = await call("nope");

    expect(res.status).toBe(404);
    expect(mockListing.findMany).not.toHaveBeenCalled();
  });
});
