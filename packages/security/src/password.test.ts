import { describe, expect, it } from "vitest";
import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "./password.js";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const encoded = await hashPassword("correct horse battery staple");
    expect(encoded).toMatch(/^scrypt:v1:/);
    expect(await verifyPassword("correct horse battery staple", encoded)).toBe(
      true,
    );
    expect(await verifyPassword("wrong password", encoded)).toBe(false);
    expect(needsPasswordRehash(encoded)).toBe(false);
  });

  it("rejects empty passwords", async () => {
    await expect(hashPassword("")).rejects.toThrow("must not be empty");
  });

  it("verifies the legacy Lingcoo scrypt format", async () => {
    const encoded = await hashPassword("legacy-compatible");
    const [, , salt, hash] = encoded.split(":");
    const legacy = `scrypt:${Buffer.from(salt!, "base64url").toString("hex")}:${Buffer.from(hash!, "base64url").toString("hex")}`;

    expect(await verifyPassword("legacy-compatible", legacy)).toBe(true);
    expect(needsPasswordRehash(legacy)).toBe(true);
  });
});
