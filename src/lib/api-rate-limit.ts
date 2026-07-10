import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./rate-limit";

interface RateLimitOptions {
  limit?: number;
  window?: number;
  keyPrefix?: string;
}

type RouteHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions = {}
) {
  const { limit = 60, window = 60_000, keyPrefix = "api" } = options;

  return async function rateLimitedHandler(
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const result = rateLimit(key, limit, window);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );
    }

    const response = await handler(req, context);

    response.headers.set("X-RateLimit-Limit", String(limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(result.resetAt / 1000))
    );

    return response;
  };
}
