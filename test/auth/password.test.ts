import { hashPassword, comparePassword } from "@/lib/auth/password";

describe("password utilities", () => {
  it("hashes and compares a password correctly", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const match = await comparePassword(password, hash);
    expect(match).toBe(true);

    const noMatch = await comparePassword("WrongPass123!", hash);
    expect(noMatch).toBe(false);
  });
});
