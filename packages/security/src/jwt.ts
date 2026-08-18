import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export type JwtClaims = JWTPayload & {
  sub: string;
  [key: string]: unknown;
};

export type JwtOptions = {
  secret: string | Uint8Array;
  issuer: string;
  audience: string;
  expiresInSeconds?: number;
};

function secretBytes(secret: string | Uint8Array) {
  const bytes =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  if (bytes.length < 32) {
    throw new TypeError("JWT secret must contain at least 32 bytes");
  }
  return bytes;
}

export async function signAccessToken(
  claims: { sub: string } & Record<string, unknown>,
  options: JwtOptions,
) {
  const expiresInSeconds = options.expiresInSeconds ?? 900;
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new TypeError("JWT expiration must be a positive integer");
  }

  const { sub, ...customClaims } = claims;

  return new SignJWT(customClaims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .setSubject(sub)
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secretBytes(options.secret));
}

export async function verifyAccessToken<T extends JwtClaims = JwtClaims>(
  token: string,
  options: JwtOptions,
) {
  const result = await jwtVerify<T>(token, secretBytes(options.secret), {
    algorithms: ["HS256"],
    issuer: options.issuer,
    audience: options.audience,
  });
  return result.payload;
}
