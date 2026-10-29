// @ts-nocheck
const mockSellerProfile = {
  findUnique: jest.fn(),
  upsert: jest.fn(),
};

const mockUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};

jest.mock("@/lib/db/prisma", () => ({
  prisma: { sellerProfile: mockSellerProfile, user: mockUser },
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
    requireVerifiedUser: (...args: any[]) => mockRequireVerifiedUser(...args),
    AuthError,
  };
});

const {
  GET: profileGet,
  POST: profilePost,
  PATCH: profilePatch,
} = require("@/api/seller/profile/route");

const completeProfile = {
  id: "profile_1",
  userId: "user_1",
  businessName: "Fixit Ltd",
  description: null,
  phoneNumber: "+2348000000000",
  country: "NG",
  state: "Lagos",
  city: "Ikeja",
  address: "1 Test Street",
  avatarUrl: null,
  professions: ["Plumbing"],
  skills: ["Pipe repair"],
  productsImageUrl: [],
  responseTime: "WITHIN_1_HOUR",
  intraStateDeliveryMinMinutes: 120,
  intraStateDeliveryMaxMinutes: 240,
  interStateDeliveryMinMinutes: 1440,
  interStateDeliveryMaxMinutes: 2880,
  isVerified: false,
  isFeatured: false,
  isTopSeller: false,
  verifiedAt: null,
  onboardingCompletedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRequest = (body: Record<string, any>) =>
  ({ json: jest.fn().mockResolvedValue(body) }) as any;

describe("/api/seller/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockRequireVerifiedUser.mockResolvedValue("user_1");
    mockUser.findUnique.mockResolvedValue({ roles: ["CUSTOMER"] });
    mockUser.update.mockResolvedValue({});
  });

  it("returns a null profile before onboarding", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(null);

    await profileGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        profile: null,
        complete: false,
      },
      undefined,
    );
  });

  it("returns the serialized profile after onboarding", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(completeProfile);

    await profileGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          businessName: "Fixit Ltd",
          phoneNumber: "+2348000000000",
          responseTimeLabel: "Within 1 hour",
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
        complete: true,
      }),
      undefined,
    );
  });

  it("creates a complete profile and stamps onboardingCompletedAt", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(null);
    mockSellerProfile.upsert.mockResolvedValue(completeProfile);

    await profilePost(
      makeRequest({
        businessName: "Fixit Ltd",
        phoneNumber: "0801 234 5678",
        country: "NG",
        state: "Lagos",
        city: "Ikeja",
        address: "1 Test Street",
        professions: ["Plumbing"],
        skills: ["Pipe repair"],
        responseTime: "WITHIN_1_HOUR",
        intraStateDelivery: { min: 2, max: 4, unit: "HOURS" },
      }),
    );

    expect(mockSellerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        create: expect.objectContaining({
          userId: "user_1",
          businessName: "Fixit Ltd",
          phoneNumber: "+2348012345678",
          responseTime: "WITHIN_1_HOUR",
          intraStateDeliveryMinMinutes: 120,
          intraStateDeliveryMaxMinutes: 240,
          onboardingCompletedAt: expect.any(Date),
        }),
      }),
    );
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ complete: true }),
      { status: 201 },
    );
    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { roles: { set: ["CUSTOMER", "SELLER"] } },
    });
  });

  it("does not stamp onboardingCompletedAt for an incomplete patch", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(null);
    mockSellerProfile.upsert.mockResolvedValue({
      ...completeProfile,
      state: null,
      onboardingCompletedAt: null,
    });

    await profilePatch(
      makeRequest({
        businessName: "Fixit Ltd",
        country: "NG",
        city: "Ikeja",
      }),
    );

    const upsertArgs = mockSellerProfile.upsert.mock.calls[0][0];
    expect(upsertArgs.update.onboardingCompletedAt).toBeUndefined();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ complete: false }),
      undefined,
    );
  });

  it("requires a business name when no profile exists", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(null);

    await profilePatch(makeRequest({ city: "Ikeja" }));

    expect(mockSellerProfile.upsert).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "BUSINESS_NAME_REQUIRED" }),
      { status: 400 },
    );
  });

  it("rejects an invalid avatar URL", async () => {
    await profilePatch(makeRequest({ avatarUrl: "not-a-url" }));

    expect(mockSellerProfile.upsert).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Invalid URL",
        code: "VALIDATION_ERROR",
        field: "avatarUrl",
      }),
      { status: 400 },
    );
  });

  it("normalises local phone numbers to E.164", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(completeProfile);
    mockSellerProfile.upsert.mockResolvedValue(completeProfile);

    await profilePatch(
      makeRequest({ phoneNumber: "0801 234 5678", country: "NG" }),
    );

    expect(mockSellerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          phoneNumber: "+2348012345678",
        }),
      }),
    );
  });

  it("rejects a phone number that is not valid for the country", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(completeProfile);

    await profilePatch(makeRequest({ phoneNumber: "abc", country: "NG" }));

    expect(mockSellerProfile.upsert).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INVALID_PHONE_NUMBER",
        field: "phoneNumber",
        error: "Enter a valid phone number for Nigeria.",
      }),
      { status: 400 },
    );
  });

  it("stores delivery units as minutes and rejects an inverted range", async () => {
    mockSellerProfile.findUnique.mockResolvedValue(completeProfile);
    mockSellerProfile.upsert.mockResolvedValue(completeProfile);

    await profilePatch(
      makeRequest({
        intraStateDelivery: { min: 2, max: 4, unit: "HOURS" },
        interStateDelivery: { min: 1, max: 2, unit: "DAYS" },
      }),
    );

    expect(mockSellerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          intraStateDeliveryMinMinutes: 120,
          intraStateDeliveryMaxMinutes: 240,
          interStateDeliveryMinMinutes: 1440,
          interStateDeliveryMaxMinutes: 2880,
        }),
      }),
    );

    jest.clearAllMocks();
    mockSellerProfile.findUnique.mockResolvedValue(completeProfile);

    await profilePatch(
      makeRequest({
        intraStateDelivery: { min: 5, max: 2, unit: "HOURS" },
      }),
    );

    expect(mockSellerProfile.upsert).not.toHaveBeenCalled();
    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        field: "intraStateDelivery.max",
      }),
      { status: 400 },
    );
  });

  it("returns 401 for unverified users", async () => {
    const { AuthError } = require("@/lib/auth/current-user");
    mockRequireVerifiedUser.mockRejectedValue(new AuthError());

    await profileGet();

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized" }),
      { status: 401 },
    );
  });
});
