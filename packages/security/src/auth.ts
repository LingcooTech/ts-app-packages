import type { JwtClaims } from "./jwt.js";

export type AuthenticatedPrincipal = {
  subject: string;
  claims: JwtClaims;
};

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_token" | "invalid_token",
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function parseBearerToken(authorization: string | undefined) {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}

export function principalFromClaims(claims: JwtClaims): AuthenticatedPrincipal {
  if (!claims.sub) {
    throw new AuthenticationError("Token subject is missing", "invalid_token");
  }
  return { subject: claims.sub, claims };
}
