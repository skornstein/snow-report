
import fs from 'fs';
import path from 'path';

// In-memory cache as first layer
const memoryCache = new Map<string, { data: any; expiry: number }>();

// File cache directory (use /tmp for serverless compatibility)
const CACHE_DIR = '/tmp';

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

export async function getCachedData<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    const now = Date.now();

    // 1. Check Memory Cache
    const memEntry = memoryCache.get(key);
    if (memEntry && memEntry.expiry > now) {
        console.log(`[Cache] HIT (Memory): ${key}`);
        return memEntry.data as T;
    }

    // 2. Check File Cache
    const filePath = path.join(CACHE_DIR, `cache_${key}.json`);
    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const fileEntry: CacheEntry<T> = JSON.parse(fileContent);

            if (fileEntry.expiry > now) {
                console.log(`[Cache] HIT (File): ${key}`);
                // Refresh memory cache
                memoryCache.set(key, fileEntry);
                return fileEntry.data;
            }
        }
    } catch (e) {
        console.warn(`[Cache] Error reading file cache for ${key}`, e);
    }

    // 3. Fetch Fresh Data
    console.log(`[Cache] MISS: ${key} - Fetching fresh data...`);
    const data = await fetchFn();

    // 4. Save to Cache
    const expiry = now + (ttlSeconds * 1000);
    const entry: CacheEntry<T> = { data, expiry };

    // Update Memory
    memoryCache.set(key, entry);

    // Update File
    try {
        fs.writeFileSync(filePath, JSON.stringify(entry));
    } catch (e) {
        console.warn(`[Cache] Error writing file cache for ${key}`, e);
    }

    return data;
}
