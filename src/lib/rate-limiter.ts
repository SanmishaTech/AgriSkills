/**
 * Token-bucket rate limiter for server-side API call throttling.
 *
 * Usage:
 *   const limiter = new RateLimiter({ tokensPerInterval: 1, intervalMs: 1000 });
 *   await limiter.waitForToken();  // resolves when a token is available
 */

export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly intervalMs: number;
  private lastRefill: number;
  private waitQueue: Array<() => void> = [];

  constructor(opts: { tokensPerInterval: number; intervalMs: number }) {
    this.maxTokens = opts.tokensPerInterval;
    this.tokens = opts.tokensPerInterval;
    this.intervalMs = opts.intervalMs;
    this.lastRefill = Date.now();
  }

  /** Refill tokens based on elapsed time since last refill */
  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = Math.floor(elapsed / this.intervalMs) * this.maxTokens;
    if (newTokens > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }

  /**
   * Returns a promise that resolves when a token is available.
   * If a token is already available, resolves immediately.
   */
  waitForToken(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    // No token available — queue the request and resolve when a token is refilled
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);

      // Schedule a check for when the next token should be available
      const waitMs = this.intervalMs - (Date.now() - this.lastRefill);
      setTimeout(() => this.processQueue(), Math.max(waitMs, 50));
    });
  }

  private processQueue() {
    this.refill();
    while (this.tokens > 0 && this.waitQueue.length > 0) {
      this.tokens -= 1;
      const next = this.waitQueue.shift();
      next?.();
    }

    // If there are still waiters, schedule another check
    if (this.waitQueue.length > 0) {
      setTimeout(() => this.processQueue(), this.intervalMs);
    }
  }
}

/**
 * Singleton rate limiter: Optimized for Paid Tier 1 (1,000 RPM for chat).
 * With 1,000 RPM available, no artificial delay is needed — 10ms buffer
 * is kept just to maintain the token-bucket structure.
 */
export const geminiRateLimiter = new RateLimiter({
  tokensPerInterval: 1,
  intervalMs: 10,
});
