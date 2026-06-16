import "server-only";

import connectDB from "@/lib/mongodb";
import StoreMenu from "@/models/storemenu";

export type StoreMenuSnapshot = {
  storeSlug: string;
  categories: any[];
  products: any[];
  menuProducts: any[];
  version?: number;
  builtAt?: Date | string | null;
  status?: string;
};

const SNAPSHOT_CACHE_TTL_MS = 60_000;
const SNAPSHOT_READ_TIMEOUT_MS = 15_000;

const snapshotCache = new Map<string, { data: StoreMenuSnapshot; expiresAt: number }>();

function normalizeStoreSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptySnapshot(storeSlug: string, status = "missing"): StoreMenuSnapshot {
  return {
    storeSlug,
    categories: [],
    products: [],
    menuProducts: [],
    builtAt: null,
    status,
  };
}

function getCachedSnapshot(storeSlug: string) {
  const cached = snapshotCache.get(storeSlug);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    snapshotCache.delete(storeSlug);
    return null;
  }

  return cached.data;
}

function setCachedSnapshot(storeSlug: string, data: StoreMenuSnapshot) {
  snapshotCache.set(storeSlug, {
    data,
    expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function readSnapshotFromDB(storeSlug: string): Promise<StoreMenuSnapshot> {
  await connectDB();

  const snapshot = await StoreMenu.findOne({ storeSlug })
    .select({
      _id: 0,
      storeSlug: 1,
      categories: 1,
      products: 1,
      menuProducts: 1,
      version: 1,
      builtAt: 1,
      status: 1,
    })
    .sort({ builtAt: -1, updatedAt: -1 })
    .lean<any>();

  const products = Array.isArray(snapshot?.products)
    ? snapshot.products
    : Array.isArray(snapshot?.menuProducts)
      ? snapshot.menuProducts
      : [];

  return {
    storeSlug,
    categories: Array.isArray(snapshot?.categories) ? snapshot.categories : [],
    products,
    menuProducts: products,
    version: snapshot?.version,
    builtAt: snapshot?.builtAt || null,
    status: snapshot?.status || "missing",
  };
}

export async function getStoreMenuSnapshot(storeSlug: string): Promise<StoreMenuSnapshot> {
  const cleanStoreSlug = normalizeStoreSlug(storeSlug);

  if (!cleanStoreSlug) return emptySnapshot("", "empty");

  const cached = getCachedSnapshot(cleanStoreSlug);
  if (cached) return cached;

  try {
    const snapshot = await withTimeout(
      readSnapshotFromDB(cleanStoreSlug),
      SNAPSHOT_READ_TIMEOUT_MS,
      `Store menu snapshot read for ${cleanStoreSlug}`
    );

    setCachedSnapshot(cleanStoreSlug, snapshot);
    return snapshot;
  } catch (error: any) {
    console.error(`StoreMenu snapshot read failed for ${cleanStoreSlug}:`, error?.message || error);

    const stale = snapshotCache.get(cleanStoreSlug)?.data;
    if (stale) return stale;

    return emptySnapshot(cleanStoreSlug, "read-failed");
  }
}
export function clearStoreMenuSnapshotCache(storeSlug?: string) {
  if (!storeSlug) {
    snapshotCache.clear();
    return;
  }

  const cleanStoreSlug = normalizeStoreSlug(storeSlug);
  if (cleanStoreSlug) {
    snapshotCache.delete(cleanStoreSlug);
  }
}