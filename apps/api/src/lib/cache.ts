type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  staleUntil: number;
  refreshing?: Promise<void>;
};

export class AsyncCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  async getOrRefresh({
    key,
    ttlMs,
    staleWhileRevalidateMs = ttlMs,
    loader,
  }: {
    key: string;
    ttlMs: number;
    staleWhileRevalidateMs?: number;
    loader: () => Promise<T>;
  }) {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && now < existing.expiresAt) {
      return existing.value;
    }

    if (existing && now < existing.staleUntil) {
      if (!existing.refreshing) {
        existing.refreshing = this.refresh(key, ttlMs, staleWhileRevalidateMs, loader);
      }
      return existing.value;
    }

    const value = await loader();
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      staleUntil: now + ttlMs + staleWhileRevalidateMs,
    });
    return value;
  }

  set(key: string, value: T, ttlMs: number, staleWhileRevalidateMs = ttlMs) {
    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      staleUntil: now + ttlMs + staleWhileRevalidateMs,
    });
  }

  private async refresh(
    key: string,
    ttlMs: number,
    staleWhileRevalidateMs: number,
    loader: () => Promise<T>
  ) {
    try {
      const value = await loader();
      this.set(key, value, ttlMs, staleWhileRevalidateMs);
    } finally {
      const current = this.store.get(key);
      if (current) {
        delete current.refreshing;
      }
    }
  }
}
