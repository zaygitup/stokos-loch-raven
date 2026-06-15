import "server-only";

import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Store from "@/models/store";
import Product from "@/models/product";
import ProductStoreConfig from "@/models/productstoreconfig";

export type FrontendMenuProduct = {
  id: string; productId: string; slug: string; title: string; name: string;
  description: string; image: string; price: number; numericPrice: number;
  categoryId: string; categoryName: string; categorySlug: string; category: string;
  storeSlug: string; isPopular: boolean; showInPopular: boolean; sortOrder: number;
  status: string; updatedAt: string; hasDetails: boolean;
};

export type FrontendMenuProductDetails = FrontendMenuProduct & {
  sizes: any[]; modifierGroups: any[]; attachedModifierGroups: any[];
  relatedUpsells: any[]; upsell: string;
};

const FALLBACK_IMAGE = "/images/placeholder-food.png";
const MODIFIER_GROUP_COLLECTIONS = ["modifiergroups","modifierGroups","modifiergroup","modifiergroupconfigs"];

// ✅ Simple in-memory cache — no 2MB limit
const memCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memCache.delete(key); return null; }
  return entry.data as T;
}
function memSet(key: string, data: any) {
  memCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cleanString(value: unknown) { return String(value || "").trim(); }
function cleanNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(cleanString(value).replace(/[^0-9.-]/g, "") || 0);
  return Number.isFinite(n) ? n : 0;
}
function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const l = value.toLowerCase().trim();
    if (["true","yes","1","active","popular","featured"].includes(l)) return true;
    if (["false","no","0","inactive","off","hidden"].includes(l)) return false;
  }
  return fallback;
}
function slugify(value: unknown) {
  return String(value || "").toLowerCase().trim()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function readArray(value: unknown) { return Array.isArray(value) ? value : []; }
function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function toPlain<T>(value: T): T { return JSON.parse(JSON.stringify(value || null)); }
function normalizeStoreId(value: unknown) { return cleanString(value).toLowerCase(); }

function buildStoreKeys(store: any, storeSlug: string) {
  return Array.from(new Set(
    [store?._id ? String(store._id) : "", store?.id ? String(store.id) : "", store?.slug ? String(store.slug) : "", storeSlug]
      .map((v) => normalizeStoreId(v)).filter(Boolean)
  ));
}
function buildProductMap(products: any[]) {
  const m = new Map<string, any>();
  products.forEach((p) => {
    if (p._id) m.set(String(p._id), p);
    if (p.id) m.set(String(p.id), p);
    if (p.slug) m.set(String(p.slug), p);
  });
  return m;
}
function getConfigProductKey(config: any) {
  return cleanString(config?.productId || config?.productID || config?.product_id);
}
function makeBaseProduct(storeSlug: string, product: any, config: any): FrontendMenuProduct {
  const productId = cleanString(product?._id || product?.id || config?.productId);
  const title = cleanString(product?.name || product?.title || "Menu Item");
  const slug = slugify(product?.slug || title || productId);
  const price = cleanNumber(config?.price ?? product?.price);
  const categoryName = cleanString(config?.categoryName || product?.categoryName || product?.category);
  const categorySlug = slugify(config?.categorySlug || product?.categorySlug || categoryName || config?.categoryId);
  const categoryId = cleanString(config?.categoryId || product?.categoryId || categorySlug);
  const isPopular = cleanBoolean(config?.isPopular) || cleanBoolean(config?.showInPopular);
  return {
    id: productId, productId, slug, title, name: title,
    description: cleanString(product?.description),
    image: cleanString(product?.image) || FALLBACK_IMAGE,
    price, numericPrice: price, categoryId, categoryName, categorySlug,
    category: categorySlug || categoryName || categoryId, storeSlug,
    isPopular, showInPopular: isPopular,
    sortOrder: Number(config?.sortOrder ?? product?.sortOrder ?? 0),
    status: cleanString(config?.status || product?.status || "Active"),
    updatedAt: cleanString(config?.updatedAt || product?.lastSavedAt || product?.updatedAt),
    hasDetails: true,
  };
}
async function findActiveStore(storeSlug: string) {
  const clean = normalizeStoreId(storeSlug);
  if (!clean) return null;
  return Store.findOne({ slug: clean, status: "Active" }).select({ _id: 1, id: 1, slug: 1, status: 1 }).lean<any>();
}
function getObjectIds(keys: string[]) {
  return keys.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
}
function getModifierGroupKeys(rawGroup: unknown) {
  if (!rawGroup) return [];
  if (typeof rawGroup === "string" || typeof rawGroup === "number") return [cleanString(rawGroup)].filter(Boolean);
  if (!isRecord(rawGroup)) return [];
  return [rawGroup._id, rawGroup.id, rawGroup.modifierGroupId, rawGroup.groupId, rawGroup.value, rawGroup.slug, rawGroup.name]
    .map((v) => cleanString(v)).filter(Boolean);
}
function modifierGroupHasOptions(rawGroup: unknown) {
  if (!isRecord(rawGroup)) return false;
  return readArray(rawGroup.options).length > 0 || readArray(rawGroup.modifierOptions).length > 0;
}
function addModifierGroupToMap(map: Map<string, any>, group: any) {
  getModifierGroupKeys(group).forEach((key) => { map.set(key, group); map.set(slugify(key), group); });
}
async function findModifierGroupDocs(keys: string[]) {
  const cleanKeys = Array.from(new Set(keys.map((k) => cleanString(k)).filter(Boolean)));
  if (!cleanKeys.length || !mongoose.connection.db) return [];
  const objectIds = getObjectIds(cleanKeys);
  const orQuery: any[] = [
    { id: { $in: cleanKeys } }, { modifierGroupId: { $in: cleanKeys } },
    { groupId: { $in: cleanKeys } }, { slug: { $in: cleanKeys.map((k) => slugify(k)) } },
    { name: { $in: cleanKeys } },
  ];
  if (objectIds.length) orQuery.push({ _id: { $in: objectIds } });
  const statusQuery = { $or: [{ status: "Active" }, { status: { $exists: false } }, { status: "" }] };
  const foundDocs: any[] = [];
  const seen = new Set<string>();
  for (const col of MODIFIER_GROUP_COLLECTIONS) {
    const docs = await mongoose.connection.db.collection(col)
      .find({ $and: [{ $or: orQuery }, statusQuery] }).sort({ sortOrder: 1, name: 1 }).toArray();
    docs.forEach((doc) => {
      const key = cleanString(doc?._id || doc?.id || doc?.modifierGroupId || doc?.slug || doc?.name);
      if (!key || seen.has(key)) return;
      seen.add(key); foundDocs.push(toPlain(doc));
    });
  }
  return foundDocs;
}
async function hydrateModifierGroups(rawGroups: any[]) {
  const groups = readArray(rawGroups);
  if (!groups.length) return [];
  const missingFull = groups.filter((g) => !modifierGroupHasOptions(g));
  const lookupKeys = Array.from(new Set(missingFull.flatMap((g) => getModifierGroupKeys(g)).filter(Boolean)));
  if (!lookupKeys.length) return groups.map((g) => toPlain(g));
  const docs = await findModifierGroupDocs(lookupKeys);
  const docMap = new Map<string, any>();
  docs.forEach((doc) => addModifierGroupToMap(docMap, doc));
  return groups.map((rawGroup) => {
    if (modifierGroupHasOptions(rawGroup)) return toPlain(rawGroup);
    const rawGroupRecord = isRecord(rawGroup) ? rawGroup : { modifierGroupId: rawGroup };
    const rawKeys = getModifierGroupKeys(rawGroup);
    const matchedDoc = rawKeys.map((k) => docMap.get(k) || docMap.get(slugify(k))).find(Boolean);
    if (!matchedDoc) return toPlain(rawGroupRecord);
    const rawOptions = readArray(rawGroupRecord.options).length ? readArray(rawGroupRecord.options) : readArray(rawGroupRecord.modifierOptions);
    const docOptions = readArray(matchedDoc.options).length ? readArray(matchedDoc.options) : readArray(matchedDoc.modifierOptions);
    return toPlain({
      ...matchedDoc, ...rawGroupRecord,
      options: rawOptions.length ? rawOptions : docOptions,
      modifierOptions: rawOptions.length ? rawOptions : docOptions,
      name: cleanString(rawGroupRecord.name || matchedDoc.name || matchedDoc.title),
      title: cleanString(rawGroupRecord.title || rawGroupRecord.name || matchedDoc.title || matchedDoc.name),
    });
  }).filter((g) => modifierGroupHasOptions(g));
}
function pickArray(config: any, product: any, key: string, fallbackKey?: string) {
  const cv = readArray(config?.[key]); if (cv.length > 0) return cv;
  if (fallbackKey) { const cfv = readArray(config?.[fallbackKey]); if (cfv.length > 0) return cfv; }
  const pv = readArray(product?.[key]); if (pv.length > 0) return pv;
  if (fallbackKey) { const pfv = readArray(product?.[fallbackKey]); if (pfv.length > 0) return pfv; }
  return [];
}

// ─── LIST — in-memory cached, no 2MB limit ───────────────────────────────────
async function getStoreMenuProductsFromDB(storeSlug: string): Promise<FrontendMenuProduct[]> {
  const cleanSlug = normalizeStoreId(storeSlug);
  if (!cleanSlug) return [];
  await connectDB();
  const store = await findActiveStore(cleanSlug);
  if (!store) return [];
  const storeKeys = buildStoreKeys(store, cleanSlug);
  const configs = await ProductStoreConfig.find({
    storeId: { $in: storeKeys },
    $and: [
      { $or: [{ status: "Active" }, { status: { $exists: false } }, { status: "" }] },
      { $or: [{ isAvailable: true }, { available: true }, { isAvailable: { $exists: false }, available: { $exists: false } }] },
    ],
  })
    .select({ _id: 1, productId: 1, storeId: 1, categoryId: 1, categoryName: 1, categorySlug: 1, price: 1, isPopular: 1, showInPopular: 1, sortOrder: 1, status: 1, updatedAt: 1 })
    .sort({ sortOrder: 1, updatedAt: -1 }).lean<any[]>();
  if (!configs.length) return [];
  const productIds = Array.from(new Set(configs.map((c) => getConfigProductKey(c)).filter(Boolean)));
  const objectIds = getObjectIds(productIds);
  const productOrQuery: any[] = [{ id: { $in: productIds } }, { slug: { $in: productIds } }];
  if (objectIds.length) productOrQuery.push({ _id: { $in: objectIds } });
  const products = await Product.find({ status: "Active", $or: productOrQuery })
    .select({ _id: 1, id: 1, name: 1, title: 1, slug: 1, description: 1, image: 1, status: 1, sortOrder: 1, updatedAt: 1, lastSavedAt: 1 })
    .lean<any[]>();
  const productMap = buildProductMap(products);
  const result = configs.map((config) => {
    const product = productMap.get(getConfigProductKey(config));
    if (!product) return null;
    return makeBaseProduct(cleanSlug, product, config);
  }).filter(Boolean) as FrontendMenuProduct[];
  return result.sort((a, b) => {
    const cat = a.categorySlug.localeCompare(b.categorySlug);
    if (cat !== 0) return cat;
    return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
  });
}

// ✅ In-memory cache — no Next.js 2MB limit
export async function getStoreMenuProducts(storeSlug: string): Promise<FrontendMenuProduct[]> {
  const cacheKey = `menu-products:${storeSlug}`;
  const cached = memGet<FrontendMenuProduct[]>(cacheKey);
  if (cached) return cached;
  const data = await getStoreMenuProductsFromDB(storeSlug);
  memSet(cacheKey, data);
  return data;
}

// ─── DETAIL — always fresh ────────────────────────────────────────────────────
export async function getStoreMenuProductDetails(
  storeSlug: string, productId: string
): Promise<FrontendMenuProductDetails | null> {
  const cleanSlug = normalizeStoreId(storeSlug);
  const cleanId = cleanString(productId);
  if (!cleanSlug || !cleanId) return null;
  await connectDB();
  const store = await findActiveStore(cleanSlug);
  if (!store) return null;
  const storeKeys = buildStoreKeys(store, cleanSlug);
  const productIdKeys = Array.from(new Set([cleanId, decodeURIComponent(cleanId)].filter(Boolean)));
  const productObjectIds = getObjectIds(productIdKeys);
  const productOrQuery: any[] = [{ id: { $in: productIdKeys } }, { slug: { $in: productIdKeys } }];
  if (productObjectIds.length) productOrQuery.push({ _id: { $in: productObjectIds } });
  const product = await Product.findOne({ status: "Active", $or: productOrQuery })
    .select({ _id: 1, id: 1, name: 1, title: 1, slug: 1, description: 1, image: 1, status: 1, sortOrder: 1, price: 1, sizes: 1, modifierGroups: 1, attachedModifierGroups: 1, relatedUpsells: 1, upsell: 1, updatedAt: 1, lastSavedAt: 1 })
    .lean<any>();
  if (!product) return null;
  const realProductKeys = Array.from(new Set(
    [product._id ? String(product._id) : "", product.id, product.slug, cleanId].map((v) => cleanString(v)).filter(Boolean)
  ));
  const configProductIds: any[] = [...realProductKeys, ...getObjectIds(realProductKeys)];
  const config = await ProductStoreConfig.findOne({
    storeId: { $in: storeKeys }, productId: { $in: configProductIds },
    $and: [
      { $or: [{ status: "Active" }, { status: { $exists: false } }, { status: "" }] },
      { $or: [{ isAvailable: true }, { available: true }, { isAvailable: { $exists: false }, available: { $exists: false } }] },
    ],
  })
    .select({ productId: 1, storeId: 1, categoryId: 1, categoryName: 1, categorySlug: 1, price: 1, sizes: 1, modifierGroups: 1, attachedModifierGroups: 1, relatedUpsells: 1, upsell: 1, isPopular: 1, showInPopular: 1, sortOrder: 1, status: 1, updatedAt: 1 })
    .lean<any>();
  if (!config) return null;
  const baseProduct = makeBaseProduct(cleanSlug, product, config);
  const sizes = pickArray(config, product, "sizes");
  const rawModifierGroups = pickArray(config, product, "modifierGroups", "attachedModifierGroups");
  const modifierGroups = await hydrateModifierGroups(rawModifierGroups);
  const relatedUpsells = pickArray(config, product, "relatedUpsells");
  return {
    ...baseProduct,
    sizes: toPlain(sizes || []),
    modifierGroups,
    attachedModifierGroups: modifierGroups,
    relatedUpsells: toPlain(relatedUpsells || []),
    upsell: cleanString(config.upsell || product.upsell),
  };
}