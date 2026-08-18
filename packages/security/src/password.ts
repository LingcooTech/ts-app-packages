import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const MAXMEM = 32 * 1024 * 1024;

export type PasswordHash = `scrypt:${string}`;

function encodedHash(salt: Buffer, hash: Buffer) {
  return `scrypt:v1:${salt.toString("base64url")}:${hash.toString("base64url")}` as PasswordHash;
}

async function derive(
  password: string,
  salt: Buffer,
  n = SCRYPT_N,
  r = SCRYPT_R,
  p = SCRYPT_P,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      { N: n, r, p, maxmem: MAXMEM },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

/** Creates a versioned scrypt password hash using Node's built-in crypto implementation. */
export async function hashPassword(password: string): Promise<PasswordHash> {
  if (!password) {
    throw new TypeError("Password must not be empty");
  }

  const salt = randomBytes(16);
  return encodedHash(salt, await derive(password, salt));
}

function parseHash(encoded: string) {
  const parts = encoded.split(":");
  if (parts[0] !== "scrypt") return null;

  if (parts[1] === "v1" && parts.length === 4) {
    const salt = Buffer.from(parts[2]!, "base64url");
    const hash = Buffer.from(parts[3]!, "base64url");
    return { salt, hash, n: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P };
  }

  // Compatibility with the existing Edu/Core/Retail format: scrypt:salt:hexHash.
  if (parts.length === 3) {
    const salt = Buffer.from(parts[1]!, "hex");
    const hash = Buffer.from(parts[2]!, "hex");
    return { salt, hash, n: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P };
  }

  return null;
}

/** Verifies both the new versioned format and the existing Lingcoo scrypt format. */
export async function verifyPassword(
  password: string,
  encoded: string | null | undefined,
) {
  if (!encoded) return false;
  const parsed = parseHash(encoded);
  if (!parsed || parsed.salt.length === 0 || parsed.hash.length === 0)
    return false;

  try {
    const actual = await derive(
      password,
      parsed.salt,
      parsed.n,
      parsed.r,
      parsed.p,
    );
    return (
      actual.length === parsed.hash.length &&
      timingSafeEqual(actual, parsed.hash)
    );
  } catch {
    return false;
  }
}

export function needsPasswordRehash(encoded: string | null | undefined) {
  return !encoded?.startsWith("scrypt:v1:");
}
