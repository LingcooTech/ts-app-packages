import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt.js";

const options = {
  secret: "01234567890123456789012345678901",
  issuer: "test-app",
  audience: "test-api",
  expiresInSeconds: 60,
};

describe("jwt", () => {
  it("signs and verifies an access token", async () => {
    const token = await signAccessToken(
      { sub: "user-1", role: "admin" },
      options,
    );
    const claims = await verifyAccessToken(token, options);
    expect(claims.sub).toBe("user-1");
    expect(claims.role).toBe("admin");
  });

  it("rejects a token with a different audience", async () => {
    const token = await signAccessToken({ sub: "user-1" }, options);
    await expect(
      verifyAccessToken(token, { ...options, audience: "other-api" }),
    ).rejects.toThrow();
  });
});
