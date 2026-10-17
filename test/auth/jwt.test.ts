import { signJwt, verifyJwt } from "@/lib/auth/jwt";

describe("jwt utilities", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("signs and verifies a token with the expected payload", () => {
    const token = signJwt(
      { sub: "user_123", email: "a@b.com", roles: ["CUSTOMER"] },
      "1h",
    );
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const payload = verifyJwt(token);
    expect(payload.sub).toBe("user_123");
    expect(payload.email).toBe("a@b.com");
    expect(payload.roles).toEqual(["CUSTOMER"]);
  });

  it("throws on an invalid token", () => {
    expect(() => verifyJwt("not-a-valid-jwt")).toThrow();
  });
});