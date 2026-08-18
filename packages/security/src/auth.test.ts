import { describe, expect, it } from "vitest";
import { parseBearerToken, principalFromClaims } from "./auth.js";

describe("auth primitives", () => {
  it("parses a bearer token without accepting another scheme", () => {
    expect(parseBearerToken("Bearer abc")).toBe("abc");
    expect(parseBearerToken("bearer abc")).toBe("abc");
    expect(parseBearerToken("Basic abc")).toBeNull();
  });

  it("creates a minimal authenticated principal", () => {
    expect(principalFromClaims({ sub: "user-1" })).toEqual({
      subject: "user-1",
      claims: { sub: "user-1" },
    });
  });
});
