/**
 * Least-recently-used cache of pending blob URLs, keyed by file path.
 *
 * Entries past the limit are evicted oldest-first and their object URLs are revoked,
 * so the underlying bytes can be garbage-collected. `get` refreshes an entry's
 * position, keeping URLs that are still in use from being evicted.
 */
export class BlobUrlCache {
  private readonly entries = new Map<string, Promise<string>>();

  constructor(
    private readonly limit: number,
    private readonly revoke: (url: string) => void = (url) => URL.revokeObjectURL(url),
  ) {}

  get size(): number {
    return this.entries.size;
  }

  get(key: string): Promise<string> | undefined {
    const value = this.entries.get(key);
    if (value !== undefined) {
      // Re-insert to mark as most recently used (Map keeps insertion order).
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }

  set(key: string, value: Promise<string>): void {
    const existing = this.entries.get(key);
    if (existing !== undefined && existing !== value) {
      this.release(existing);
    }
    this.entries.delete(key);
    this.entries.set(key, value);

    while (this.entries.size > this.limit) {
      const oldestKey = this.entries.keys().next().value as string;
      const oldest = this.entries.get(oldestKey);
      this.entries.delete(oldestKey);
      if (oldest !== undefined) {
        this.release(oldest);
      }
    }
  }

  /** Removes an entry without revoking it (used when its promise rejected). */
  delete(key: string, value?: Promise<string>): void {
    if (value === undefined || this.entries.get(key) === value) {
      this.entries.delete(key);
    }
  }

  clear(): void {
    for (const value of this.entries.values()) {
      this.release(value);
    }
    this.entries.clear();
  }

  private release(value: Promise<string>): void {
    value
      .then((url) => {
        if (url && url.startsWith('blob:')) {
          this.revoke(url);
        }
      })
      .catch(() => {});
  }
}
