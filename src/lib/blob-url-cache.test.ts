import { describe, expect, it, vi } from 'vitest';
import { BlobUrlCache } from './blob-url-cache';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('BlobUrlCache', () => {
  it('evicts the least recently used entry and revokes its blob URL', async () => {
    const revoke = vi.fn();
    const cache = new BlobUrlCache(2, revoke);

    cache.set('a', Promise.resolve('blob:a'));
    cache.set('b', Promise.resolve('blob:b'));
    cache.get('a'); // a is now more recent than b
    cache.set('c', Promise.resolve('blob:c'));
    await flush();

    expect(cache.size).toBe(2);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBeDefined();
    expect(cache.get('c')).toBeDefined();
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:b');
  });

  it('revokes every blob URL on clear, ignoring non-blob URLs and failures', async () => {
    const revoke = vi.fn();
    const cache = new BlobUrlCache(5, revoke);
    cache.set('a', Promise.resolve('blob:a'));
    cache.set('b', Promise.resolve('https://example.com/b.sid'));
    cache.set('c', Promise.reject(new Error('read failed')));

    cache.clear();
    await flush();

    expect(cache.size).toBe(0);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:a');
  });

  it('delete removes only the matching pending value without revoking', async () => {
    const revoke = vi.fn();
    const cache = new BlobUrlCache(5, revoke);
    const first = Promise.resolve('blob:first');
    const second = Promise.resolve('blob:second');
    cache.set('a', first);
    cache.set('a', second);
    cache.delete('a', first);
    await flush();

    expect(cache.get('a')).toBe(second);
    expect(revoke).toHaveBeenCalledWith('blob:first');

    cache.delete('a');
    await flush();
    expect(cache.size).toBe(0);
    expect(revoke).toHaveBeenCalledTimes(1);
  });
});
