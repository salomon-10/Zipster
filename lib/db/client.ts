import { setDefaultResultOrder } from 'node:dns';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Node's fetch (undici) races IPv4 and IPv6 connection attempts. On networks
// where IPv6 has no route at all (common on many local/ISP setups), that race
// can eat the whole connection timeout instead of falling back to IPv4
// quickly — surfacing as `ConnectTimeoutError: fetch failed` even though a
// plain `curl` to the same host works instantly. Forcing IPv4 first avoids
// the race entirely. Safe to call repeatedly; only the first call matters.
setDefaultResultOrder('ipv4first');

let cached: NeonQueryFunction<false, false> | null = null;

const RETRYABLE = /fetch failed|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i;
const MAX_ATTEMPTS = 3;

/** Walks the `.cause` chain so a wrapped `ConnectTimeoutError` (buried inside
 *  a `TypeError: fetch failed`) is still visible to the retryable-error check. */
function errorChainMessage(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message, current.name);
      current = (current as { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(' | ');
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !RETRYABLE.test(errorChainMessage(error))) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
    }
  }
  throw lastError;
}

/**
 * Lazily resolves the Neon client so that a missing `DATABASE_URL` fails at
 * request time with a readable message, rather than crashing the build.
 *
 * The returned function is wrapped so a single flaky connection attempt —
 * confirmed to happen intermittently on some networks even when the host is
 * otherwise reachable — retries automatically instead of surfacing as a
 * user-facing error. This covers both call styles transparently:
 * `sql\`select ...\`` (tagged template) and `sql.query('select $1', [x])`.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon connection string.',
    );
  }

  const client = neon(url);

  cached = new Proxy(client, {
    apply(target, thisArg, args) {
      return withRetry(() => Reflect.apply(target, thisArg, args));
    },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'query' && typeof value === 'function') {
        return (...args: unknown[]) =>
          withRetry(() => (value as (...a: unknown[]) => Promise<unknown>).apply(target, args));
      }
      return value;
    },
  }) as NeonQueryFunction<false, false>;

  return cached;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
