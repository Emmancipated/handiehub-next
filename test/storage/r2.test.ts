// @ts-nocheck
import {
  ALLOWED_UPLOAD_TYPES,
  buildObjectKey,
  extensionForContentType,
  getPublicUrl,
} from "@/lib/storage/r2";

describe("r2 helpers", () => {
  it("maps supported content types to extensions", () => {
    expect(extensionForContentType("image/jpeg")).toBe("jpg");
    expect(extensionForContentType("image/png")).toBe("png");
    expect(extensionForContentType("image/webp")).toBe("webp");
  });

  it("returns null for unsupported content types", () => {
    expect(extensionForContentType("application/pdf")).toBeNull();
  });

  it("keeps every allowed type mappable to an extension", () => {
    for (const type of ALLOWED_UPLOAD_TYPES) {
      expect(extensionForContentType(type)).toEqual(expect.any(String));
    }
  });

  it("scopes object keys to the folder and user", () => {
    const key = buildObjectKey("avatars", "user_1", "image/png");
    expect(key).toMatch(/^avatars\/user_1\/.+\.png$/);
  });

  it("builds public URLs from the configured base", () => {
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET = "bucket";
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com/";

    expect(getPublicUrl("avatars/user_1/x.png")).toBe(
      "https://cdn.example.com/avatars/user_1/x.png",
    );

    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    delete process.env.R2_PUBLIC_BASE_URL;
  });
});
