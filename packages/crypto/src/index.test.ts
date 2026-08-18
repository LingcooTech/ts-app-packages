import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson, EncryptionError } from "./index.js";

describe("crypto", () => {
  it("encrypts and decrypts JSON", () => {
    const envelope = encryptJson({ enabled: true, count: 3 }, "test-secret");
    expect(decryptJson(envelope, "test-secret")).toEqual({
      enabled: true,
      count: 3,
    });
    expect(envelope.version).toBe(1);
    expect(envelope.alg).toBe("aes-256-gcm");
  });

  it("rejects tampered data and wrong secrets", () => {
    const envelope = encryptJson({ value: "private" }, "test-secret");
    const tampered = { ...envelope, data: `${envelope.data}x` };
    expect(() => decryptJson(tampered, "test-secret")).toThrow(EncryptionError);
    expect(() => decryptJson(envelope, "wrong-secret")).toThrow(
      EncryptionError,
    );
  });
});
