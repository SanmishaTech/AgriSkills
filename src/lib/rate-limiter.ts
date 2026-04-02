/**
 * LOW LEVEL EXPLANATION ("The Token Bucket"):
 * Imagine a bucket that slowly fills up with water drops (tokens) over time.
 * Every time someone wants to make an API call, they must scoop one drop out of the bucket.
 * If the bucket is empty, they must wait in a line (queue) until a new drop drips in.
 * 
 * This prevents our server from slamming the Gemini API with a million requests at once.
 */

export class RateLimiter {
  private tokens: number;               // How many drops are currently in the bucket
  private readonly maxTokens: number;    // The absolute maximum drops the bucket can hold
  private readonly intervalMs: number;   // How many milliseconds it takes for a new drop to fall in
  private lastRefill: number;            // A timestamp of the exact moment the last drop fell
  private waitQueue: Array<() => void> = []; // The waiting line of API calls

  constructor(opts: { tokensPerInterval: number; intervalMs: number }) {
    this.maxTokens = opts.tokensPerInterval;
    this.tokens = opts.tokensPerInterval;
    this.intervalMs = opts.intervalMs;
    this.lastRefill = Date.now();
  }

  /** Checks how much time has passed and adds drops (tokens) to the bucket accordingly */
  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill; // Time passed since we last checked
    
    // Calculate how many full intervals have passed
    const newTokens = Math.floor(elapsed / this.intervalMs) * this.maxTokens;
    
    if (newTokens > 0) {
      // Add the new drops, but never let it overflow past maxTokens
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }

  /**
   * Anyone wanting to make an API call runs this function.
   * If there is a drop in the bucket, they get it instantly.
   * If not, they are frozen (via Promise) and pushed into the waiting line.
   */
  waitForToken(): Promise<void> {
    this.refill();

    // Yay! We have a drop ready.
    if (this.tokens > 0) {
      this.tokens -= 1; // Take it
      return Promise.resolve(); // Let the API call proceed instantly
    }

    // No drops available. Freeze the caller in a Promise and put them in the queue.
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);

      // Set an alarm to check the bucket as soon as the next drop is supposed to arrive
      const waitMs = this.intervalMs - (Date.now() - this.lastRefill);
      setTimeout(() => this.processQueue(), Math.max(waitMs, 50));
    });
  }

  /**
   * This function gets called when the alarm rings.
   * It checks if any new drops have arrived, and starts unfreezing people in line.
   */
  private processQueue() {
    this.refill();
    
    // As long as we have drops AND people are waiting in line...
    while (this.tokens > 0 && this.waitQueue.length > 0) {
      this.tokens -= 1; // Take a drop
      const unlockNextPerson = this.waitQueue.shift(); // Remove the first person from the line
      unlockNextPerson?.(); // Unfreeze their code so they can make their API call
    }

    // If there is still a line but we ran out of drops again, set another alarm
    if (this.waitQueue.length > 0) {
      setTimeout(() => this.processQueue(), this.intervalMs);
    }
  }
}

/**
 * Our specific configuration:
 * We allow 1 API call every 10 milliseconds. 
 * This keeps a steady stream without causing pileups.
 */
export const geminiRateLimiter = new RateLimiter({
  tokensPerInterval: 1,
  intervalMs: 10,
});
