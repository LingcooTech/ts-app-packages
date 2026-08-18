import { describe, expect, it } from "vitest";
import {
  ApiError,
  apiErrorResponseFromException,
  createApiErrorResponse,
  isApiErrorResponse,
} from "./index.js";

describe("http contracts", () => {
  it("creates the stable error response shape", () => {
    const response = createApiErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: { field: "email" },
      },
      "request-123",
    );

    expect(response).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: { field: "email" },
        requestId: "request-123",
      },
    });
    expect(isApiErrorResponse(response)).toBe(true);
  });

  it("hides unexpected exception details", () => {
    const response = apiErrorResponseFromException(
      new Error("database secret"),
      "request-456",
    );
    expect(response).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        requestId: "request-456",
      },
    });
  });

  it("preserves application errors", () => {
    const response = apiErrorResponseFromException(
      new ApiError(422, "VALIDATION_ERROR", "Request validation failed", {
        field: "email",
      }),
    );
    expect(response.error.code).toBe("VALIDATION_ERROR");
    expect(response.error.details).toEqual({ field: "email" });
  });
});
