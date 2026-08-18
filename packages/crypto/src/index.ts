import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = 1 as const;
const IV_BYTES = 12;

export type EncryptedEnvelope = {
  version: typeof VERSION;
  alg: typeof ALGORITHM;
  iv: string;
  tag: string;
  data: string;
};

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionError";
  }
}

function keyFromSecret(secret: string | Uint8Array) {
  const input =
    typeof secret === "string"
      ? Buffer.from(secret, "utf8")
      : Buffer.from(secret);
  if (input.length === 0)
    throw new TypeError("Encryption secret must not be empty");
  return createHash("sha256").update(input).digest();
}

function isEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const envelope = value as Partial<EncryptedEnvelope>;
  return (
    envelope.version === VERSION &&
    envelope.alg === ALGORITHM &&
    typeof envelope.iv === "string" &&
    typeof envelope.tag === "string" &&
    typeof envelope.data === "string"
  );
}

export function encryptJson(
  value: unknown,
  secret: string | Uint8Array,
): EncryptedEnvelope {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, keyFromSecret(secret), iv);
  const serialized = JSON.stringify(value);
  if (serialized === undefined)
    throw new TypeError("Value must be JSON serializable");
  const plaintext = Buffer.from(serialized, "utf8");
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return {
    version: VERSION,
    alg: ALGORITHM,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    data: data.toString("base64url"),
  };
}

export function decryptJson<T>(value: unknown, secret: string | Uint8Array): T {
  if (!isEnvelope(value))
    throw new EncryptionError("Encrypted payload format is invalid");

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      keyFromSecret(secret),
      Buffer.from(value.iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(value.tag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(value.data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(plaintext) as T;
  } catch {
    throw new EncryptionError("Failed to decrypt payload");
  }
}
