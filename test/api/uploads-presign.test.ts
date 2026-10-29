// @ts-nocheck
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

const mockIsR2Configured = jest.fn(() => true);
const mockBuildObjectKey = jest.fn(() => "listings/user_1/123.jpg");
const mockCreatePresignedPutUrl = jest.fn(async () => ({
  uploadUrl: "https://r2.example.com/presigned",
  publicUrl: "https://cdn.example.com/listings/user_1/123.jpg",
  expiresInSeconds: 600,
}));

jest.mock("@/lib/storage/r2", () => ({
  ALLOWED_UPLOAD_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ],
  isR2Configured: (...args: any[]) => mockIsR2Configured(...args),
  buildObjectKey: (...args: any[]) => mockBuildObjectKey(...args),
  createPresignedPutUrl: (...args: any[]) => mockCreatePresignedPutUrl(...args),
}));

const { POST: presignPost } = require("@/api/uploads/presign/route");

const makeRequest = (body: Record<string, any>) =>
  ({ json: jest.fn().mockResolvedValue(body) }) as any;

describe("POST /api/uploads/presign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseJson.mockClear();
    mockIsR2Configured.mockReturnValue(true);
    mockRequireVerifiedUser.mockResolvedValue("user_1");
  });

  it("returns a presigned PUT URL for a supported image type", async () => {
    await presignPost(makeRequest({ contentType: "image/jpeg", folder: "listings" }));

    expect(mockBuildObjectKey).toHaveBeenCalledWith(
      "listings",
      "user_1",
      "image/jpeg",
    );
    expect(mockCreatePresignedPutUrl).toHaveBeenCalledWith({
      key: "listings/user_1/123.jpg",
      contentType: "image/jpeg",
    });
    expect(nextResponseJson).toHaveBeenCalledWith(
      {
        uploadUrl: "https://r2.example.com/presigned",
        publicUrl: "https://cdn.example.com/listings/user_1/123.jpg",
        key: "listings/user_1/123.jpg",
        expiresInSeconds: 600,
        headers: { "Content-Type": "image/jpeg" },
      },
      undefined,
    );
  });

  it("defaults the folder to listings", async () => {
    await presignPost(makeRequest({ contentType: "image/png" }));

    expect(mockBuildObjectKey).toHaveBeenCalledWith(
      "listings",
      "user_1",
      "image/png",
    );
  });

  it("returns 503 when R2 is not configured", async () => {
    mockIsR2Configured.mockReturnValue(false);

    await presignPost(makeRequest({ contentType: "image/jpeg" }));

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ code: "UPLOADS_NOT_CONFIGURED" }),
      { status: 503 },
    );
    expect(mockCreatePresignedPutUrl).not.toHaveBeenCalled();
  });

  it("rejects unsupported content types", async () => {
    await presignPost(makeRequest({ contentType: "application/pdf" }));

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed" }),
      { status: 400 },
    );
  });

  it("rejects unauthenticated requests", async () => {
    const { AuthError } = require("@/lib/auth/current-user");
    mockRequireVerifiedUser.mockRejectedValue(new AuthError());

    await presignPost(makeRequest({ contentType: "image/jpeg" }));

    expect(nextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized" }),
      { status: 401 },
    );
  });
});
