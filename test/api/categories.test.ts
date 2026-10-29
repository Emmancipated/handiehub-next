// @ts-nocheck
const mockCategory = {
  findMany: jest.fn(),
  count: jest.fn(),
};
const mockListing = {
  groupBy: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: { category: mockCategory, listing: mockListing },
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

const { GET } = require("@/api/listings/categories/route");

describe("GET /api/listings/categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListing.groupBy.mockResolvedValue([]);
  });

  it("adds active product/service counts per category", async () => {
    mockCategory.findMany.mockResolvedValue([
      {
        id: "cat_1",
        slug: "plumbing",
        name: "Plumbing",
        parentId: null,
        children: [],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "cat_2",
        slug: "furniture",
        name: "Furniture",
        parentId: null,
        children: [],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    mockCategory.count.mockResolvedValue(2);
    mockListing.groupBy.mockResolvedValue([
      { categoryId: "cat_1", kind: "PRODUCT", _count: { _all: 3 } },
      { categoryId: "cat_1", kind: "SERVICE", _count: { _all: 2 } },
    ]);

    const res = await GET(
      new Request("http://localhost/api/listings/categories?limit=100"),
    );

    expect(mockCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parentId: null } }),
    );
    expect(mockListing.groupBy).toHaveBeenCalledWith({
      by: ["categoryId", "kind"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    });
    expect(res.body.categories[0].stats).toEqual({
      listings: 5,
      products: 3,
      services: 2,
    });
    expect(res.body.categories[1].stats).toEqual({
      listings: 0,
      products: 0,
      services: 0,
    });
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 100,
      total: 2,
      totalPages: 1,
    });
  });

  it("rolls subcategory listings into the parent totals", async () => {
    mockCategory.findMany.mockResolvedValue([
      {
        id: "home_kitchen",
        slug: "home_kitchen",
        name: "Home & Kitchen",
        parentId: null,
        children: [
          {
            id: "home_kitchen_furniture",
            slug: "home_kitchen_furniture",
            name: "Furniture",
            parentId: "home_kitchen",
          },
        ],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    mockCategory.count.mockResolvedValue(1);
    mockListing.groupBy.mockResolvedValue([
      { categoryId: "home_kitchen", kind: "SERVICE", _count: { _all: 1 } },
      {
        categoryId: "home_kitchen_furniture",
        kind: "PRODUCT",
        _count: { _all: 3 },
      },
    ]);

    const res = await GET(
      new Request("http://localhost/api/listings/categories?limit=100"),
    );

    expect(res.body.categories[0].stats).toEqual({
      listings: 4,
      products: 3,
      services: 1,
    });
    expect(res.body.categories[0].children[0].stats).toEqual({
      listings: 3,
      products: 3,
      services: 0,
    });
  });

  it("validates the limit", async () => {
    const res = await GET(
      new Request("http://localhost/api/listings/categories?limit=500"),
    );

    expect(res.status).toBe(400);
  });
});
