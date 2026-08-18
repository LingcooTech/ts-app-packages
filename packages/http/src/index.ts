export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export type ApiErrorResponse = {
  error: ApiErrorPayload;
};

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiErrorResponse(
  error: Pick<ApiErrorPayload, "code" | "message"> &
    Partial<Pick<ApiErrorPayload, "details">>,
  requestId?: string,
): ApiErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
      ...(requestId === undefined ? {} : { requestId }),
    },
  };
}

export function apiErrorResponseFromException(
  exception: unknown,
  requestId?: string,
): ApiErrorResponse {
  if (exception instanceof ApiError) {
    return createApiErrorResponse(exception, requestId);
  }

  return createApiErrorResponse(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
    requestId,
  );
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== "object" || !("error" in value)) return false;
  const error = value.error;
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}
