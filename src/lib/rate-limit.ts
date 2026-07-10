interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 60_000) {
      store.delete(key);
    }
  }
}

let lastCleanup = Date.now();

export function rateLimit(
  key: string,
  limit: number,
  window: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  if (now - lastCleanup > 60_000) {
    cleanup();
    lastCleanup = now;
  }

  const entry = store.get(key);

  if (!entry || now - entry.windowStart > window) {
    store.set(key, { count: 1, windowStart: now });
    return { success: true, remaining: limit - 1, resetAt: now + window };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.windowStart + window,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + window,
  };
}
