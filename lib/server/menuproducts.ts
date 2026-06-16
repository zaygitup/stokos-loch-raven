import "server-only";

import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Store from "@/models/store";
import Product from "@/models/product";
import ProductStoreConfig from "@/models/productstoreconfig";

export type FrontendMenuProduct = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  name: string;
  description: string;
  image: string;
  price: number;
  numericPrice: number;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  category: string;
  storeSlug: string;
  isPopular: boolean;
  showInPopular: boolean;
  sortOrder: number;
  status: string;
  updatedAt: string;
  hasDetails: boolean;
  sizes: any[];
  modifierGroups: any[];
  attachedModifierGroups: any[];
  relatedUpsells: any[];
  upsell: string;
};

export type FrontendMenuProductDetails = FrontendMenuProduct;

const FALLBACK_IMAGE = "/images/placeholder-food.png";
const DEFAULT_CATEGORY_NAME = "Menu Items";
const DEFAULT_CATEGORY_SLUG = "menu-items";
const MENU_CACHE_TTL_MS = 60_000;
const DETAIL_CACHE_TTL_MS = 30_000;

const ACTIVE_STATUS_VALUES = [
  "",
  "Active",
  "active",
  "ACTIVE",
  "Published",
  "published",
  "PUBLISHED",
  "Available",
  "available",
  "AVAILABLE",
  "Ready",
  "ready",
];

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const memCache = new Map<string, CacheEntry<any>>();

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }

  return entry.data as T;
}

function memSet<T>(key: string, data: T, ttlMs: number) {
  memCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearStoreMenuProductsCache(storeSlug?: string) {
  if (!storeSlug) {
    memCache.clear();
    return;
  }

  const slug = normalizeStoreSlug(storeSlug);
  memCache.delete(`menu-products:${slug}`);

  Array.from(memCache.keys()).forEach((key) => {
    if (key.startsWith(`menu-product-detail:${slug}:`)) {
      memCache.delete(key);
    }
  });
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const number = Number(cleanString(value).replace(/[^0-9.-]/g, "") || 0);
  return Number.isFinite(number) ? number : 0;
}

function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();

    if (["true", "yes", "1", "active", "popular", "featured", "available"].includes(lower)) {
      return true;
    }

    if (["false", "no", "0", "inactive", "off", "hidden", "unavailable"].includes(lower)) {
      return false;
    }
  }

  return fallback;
}

function firstFilled(...values: unknown[]) {
  return values.find(
    (value) => value !== undefined && value !== null && cleanString(value) !== ""
  );
}

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStoreSlug(value: unknown) {
  return slugify(value);
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value || null));
}

function getObjectIds(values: string[]) {
  return values
    .filter((value) => mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));
}

function uniqueStrings(values: unknown[]) {
  return Array.from(new Set(values.map(cleanString).filter(Boolean)));
}

function getModelPath(model: any, path: string) {
  return model?.schema?.path?.(path);
}

function buildFieldInQuery(model: any, path: string, values: unknown[]) {
  const schemaPath = getModelPath(model, path);
  if (!schemaPath) return null;

  const stringValues = uniqueStrings(values);
  const objectValues = getObjectIds(stringValues);
  const instance = cleanString(schemaPath.instance).toLowerCase();

  let finalValues: any[] = stringValues;

  if (instance === "objectid") {
    finalValues = objectValues;
  } else if (instance === "string") {
    finalValues = stringValues;
  } else {
    finalValues = [...stringValues, ...objectValues];
  }

  if (!finalValues.length) return null;

  return { [path]: { $in: finalValues } };
}

function activeStatusQuery() {
  return {
    $or: [
      { status: { $exists: false } },
      { status: null },
      { status: { $in: ACTIVE_STATUS_VALUES } },
    ],
  };
}

function availableQuery() {
  return {
    $or: [
      { isAvailable: true },
      { available: true },
      { isAvailable: { $exists: false }, available: { $exists: false } },
    ],
  };
}

function getNestedId(value: any) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return cleanString(value);
  if (value?._id) return cleanString(value._id);
  if (value?.id) return cleanString(value.id);
  if (value?.slug) return cleanString(value.slug);
  return "";
}

function buildStoreLookupValues(store: any, storeSlug: string) {
  const stringValues = uniqueStrings([
    store?._id,
    store?.id,
    store?.slug,
    store?.name,
    storeSlug,
  ]).map((value) => value.toLowerCase());

  return [...stringValues, ...getObjectIds(stringValues)];
}

function buildStoreConfigQuery(storeValues: any[]) {
  const queries = [
    buildFieldInQuery(ProductStoreConfig, "storeId", storeValues),
    buildFieldInQuery(ProductStoreConfig, "store", storeValues),
    buildFieldInQuery(ProductStoreConfig, "store_id", storeValues),
    buildFieldInQuery(ProductStoreConfig, "storeSlug", storeValues),
  ].filter(Boolean) as any[];

  // Fallback for older schemas that only have storeId.
  if (!queries.length) {
    queries.push({ storeId: { $in: storeValues } });
  }

  return queries.length === 1 ? queries[0] : { $or: queries };
}

function getConfigProductKey(config: any) {
  return cleanString(
    getNestedId(config?.productId) ||
      getNestedId(config?.productID) ||
      getNestedId(config?.product_id) ||
      getNestedId(config?.product) ||
      config?.productSlug ||
      config?.slug ||
      config?.productName
  );
}

function buildProductMap(products: any[]) {
  const map = new Map<string, any>();

  products.forEach((product) => {
    const keys = [product?._id, product?.id, product?.slug, product?.name, product?.title]
      .map((value) => cleanString(value))
      .filter(Boolean);

    keys.forEach((key) => {
      map.set(key, product);
      map.set(slugify(key), product);
    });
  });

  return map;
}

function pickArray(config: any, product: any, key: string, fallbackKey?: string) {
  const configValue = readArray(config?.[key]);
  if (configValue.length > 0) return configValue;

  if (fallbackKey) {
    const configFallbackValue = readArray(config?.[fallbackKey]);
    if (configFallbackValue.length > 0) return configFallbackValue;
  }

  const productValue = readArray(product?.[key]);
  if (productValue.length > 0) return productValue;

  if (fallbackKey) {
    const productFallbackValue = readArray(product?.[fallbackKey]);
    if (productFallbackValue.length > 0) return productFallbackValue;
  }

  return [];
}

function getCategoryName(config: any, product: any) {
  const productCategory = typeof product?.category === "string" ? product.category : "";

  return cleanString(
    config?.categoryName ||
      product?.categoryName ||
      product?.categoryTitle ||
      product?.category?.name ||
      product?.category?.title ||
      productCategory ||
      DEFAULT_CATEGORY_NAME
  );
}

function getCategorySlug(config: any, product: any, categoryName: string) {
  return (
    slugify(
      config?.categorySlug ||
        product?.categorySlug ||
        product?.category?.slug ||
        product?.category?.id ||
        product?.category?._id ||
        categoryName ||
        config?.categoryId ||
        product?.categoryId
    ) || DEFAULT_CATEGORY_SLUG
  );
}

function isPopularProduct(config: any, product: any) {
  return (
    cleanBoolean(config?.isPopular) ||
    cleanBoolean(config?.showInPopular) ||
    cleanBoolean(product?.isPopular) ||
    cleanBoolean(product?.showInPopular) ||
    cleanBoolean(product?.popular) ||
    cleanBoolean(product?.featured)
  );
}

function buildFrontendProduct(
  storeSlug: string,
  product: any,
  config: any,
  includeDetails: boolean
): FrontendMenuProduct {
  const title = cleanString(product?.name || product?.title || config?.productName || "Menu Item");
  const productKey = getConfigProductKey(config);
  const productId = cleanString(
    product?._id || product?.id || productKey || product?.slug || slugify(title)
  );
  const slug = slugify(product?.slug || config?.productSlug || config?.slug || title || productId);
  const price = cleanNumber(firstFilled(config?.price, product?.price, product?.numericPrice));

  const categoryName = getCategoryName(config, product);
  const categorySlug = getCategorySlug(config, product, categoryName);
  const categoryId = cleanString(
    config?.categoryId || product?.categoryId || categorySlug || categoryName
  );
  const popular = isPopularProduct(config, product);

  const rawModifierGroups = includeDetails
    ? pickArray(config, product, "modifierGroups", "attachedModifierGroups")
    : [];

  return toPlain({
    id: productId,
    productId,
    slug,
    title,
    name: title,
    description: cleanString(product?.description || config?.description),
    image: cleanString(config?.image || product?.image) || FALLBACK_IMAGE,
    price,
    numericPrice: price,
    categoryId,
    categoryName: categoryName || DEFAULT_CATEGORY_NAME,
    categorySlug: categorySlug || DEFAULT_CATEGORY_SLUG,
    category: categorySlug || categoryName || categoryId || DEFAULT_CATEGORY_SLUG,
    storeSlug,
    isPopular: popular,
    showInPopular: popular,
    sortOrder: cleanNumber(config?.sortOrder ?? product?.sortOrder ?? 0),
    status: cleanString(config?.status || product?.status || "Active"),
    updatedAt: cleanString(config?.updatedAt || product?.lastSavedAt || product?.updatedAt),
    hasDetails: includeDetails,
    sizes: includeDetails ? pickArray(config, product, "sizes") : [],
    modifierGroups: rawModifierGroups,
    attachedModifierGroups: rawModifierGroups,
    relatedUpsells: includeDetails ? pickArray(config, product, "relatedUpsells") : [],
    upsell: includeDetails ? cleanString(config?.upsell || product?.upsell) : "",
  });
}

async function findActiveStore(storeSlug: string) {
  return Store.findOne({
    slug: storeSlug,
    $and: [activeStatusQuery()],
  })
    .select({ _id: 1, id: 1, slug: 1, name: 1, status: 1 })
    .lean<any>();
}

async function getActiveStoreProductConfigs(storeValues: any[], includeDetails: boolean) {
  const storeQuery = buildStoreConfigQuery(storeValues);

  return ProductStoreConfig.find({
    $and: [storeQuery, activeStatusQuery(), availableQuery()],
  })
    .select({
      _id: 1,
      productId: 1,
      productID: 1,
      product_id: 1,
      product: 1,
      productSlug: 1,
      productName: 1,
      slug: 1,
      storeId: 1,
      store: 1,
      store_id: 1,
      storeSlug: 1,
      categoryId: 1,
      categoryName: 1,
      categorySlug: 1,
      price: 1,
      image: 1,
      description: 1,
      isPopular: 1,
      showInPopular: 1,
      sortOrder: 1,
      status: 1,
      isAvailable: 1,
      available: 1,
      updatedAt: 1,
      ...(includeDetails
        ? {
            sizes: 1,
            modifierGroups: 1,
            attachedModifierGroups: 1,
            relatedUpsells: 1,
            upsell: 1,
          }
        : {}),
    })
    .sort({ sortOrder: 1, updatedAt: -1 })
    .lean<any[]>();
}

async function findProductsByIds(productIds: string[], includeDetails: boolean) {
  const cleanIds = Array.from(new Set(productIds.map(cleanString).filter(Boolean)));
  if (!cleanIds.length) return [];

  const objectIds = getObjectIds(cleanIds);
  const productOrQuery: any[] = [
    { id: { $in: cleanIds } },
    { slug: { $in: cleanIds.map(slugify) } },
    { name: { $in: cleanIds } },
    { title: { $in: cleanIds } },
  ];

  if (objectIds.length) {
    productOrQuery.push({ _id: { $in: objectIds } });
  }

  return Product.find({
    $and: [activeStatusQuery(), { $or: productOrQuery }],
  })
    .select({
      _id: 1,
      id: 1,
      name: 1,
      title: 1,
      slug: 1,
      description: 1,
      image: 1,
      status: 1,
      sortOrder: 1,
      price: 1,
      numericPrice: 1,
      category: 1,
      categoryId: 1,
      categoryName: 1,
      categoryTitle: 1,
      categorySlug: 1,
      isPopular: 1,
      showInPopular: 1,
      popular: 1,
      featured: 1,
      updatedAt: 1,
      lastSavedAt: 1,
      ...(includeDetails
        ? {
            sizes: 1,
            modifierGroups: 1,
            attachedModifierGroups: 1,
            relatedUpsells: 1,
            upsell: 1,
          }
        : {}),
    })
    .lean<any[]>();
}

async function getStoreMenuProductsFromDB(
  storeSlug: string,
  includeDetails = false
): Promise<FrontendMenuProduct[]> {
  const cleanSlug = normalizeStoreSlug(storeSlug);
  if (!cleanSlug) return [];

  await connectDB();

  const store = await findActiveStore(cleanSlug);
  const storeValues = buildStoreLookupValues(store || { slug: cleanSlug }, cleanSlug);
  const configs = await getActiveStoreProductConfigs(storeValues, includeDetails);

  if (!configs.length) return [];

  const productIds = Array.from(
    new Set(configs.map((config) => getConfigProductKey(config)).filter(Boolean))
  ) as string[];

  const products = await findProductsByIds(productIds, includeDetails);
  const productMap = buildProductMap(products);

  const result = configs
    .map((config) => {
      const configKey = getConfigProductKey(config);
      const product = productMap.get(configKey) || productMap.get(slugify(configKey)) || {};

      // If product join fails but config has enough data, still show the item on frontend.
      if (!product?._id && !product?.id && !product?.slug && !config?.productName) return null;

      return buildFrontendProduct(cleanSlug, product, config, includeDetails);
    })
    .filter(Boolean) as FrontendMenuProduct[];

  return result.sort((a, b) => {
    const categorySort = cleanString(a.categorySlug).localeCompare(cleanString(b.categorySlug));
    if (categorySort !== 0) return categorySort;

    return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
  });
}

// Public menu list + snapshot rebuild helper: lightweight only.
export async function getStoreMenuProducts(storeSlug: string): Promise<FrontendMenuProduct[]> {
  const cleanSlug = normalizeStoreSlug(storeSlug);
  if (!cleanSlug) return [];

  const cacheKey = `menu-products:${cleanSlug}`;
  const cached = memGet<FrontendMenuProduct[]>(cacheKey);
  if (cached) return cached;

  const data = await getStoreMenuProductsFromDB(cleanSlug, false);
  memSet(cacheKey, data, MENU_CACHE_TTL_MS);
  return data;
}

// Product modal helper: only runs after user clicks one product.
export async function getStoreMenuProductDetails(
  storeSlug: string,
  productId: string
): Promise<FrontendMenuProductDetails | null> {
  const cleanSlug = normalizeStoreSlug(storeSlug);
  const cleanId = cleanString(productId);

  if (!cleanSlug || !cleanId) return null;

  const cacheKey = `menu-product-detail:${cleanSlug}:${cleanId}`;
  const cached = memGet<FrontendMenuProductDetails>(cacheKey);
  if (cached) return cached;

  await connectDB();

  const store = await findActiveStore(cleanSlug);
  const storeValues = buildStoreLookupValues(store || { slug: cleanSlug }, cleanSlug);
  const productIdKeys = Array.from(new Set([cleanId, decodeURIComponent(cleanId)].filter(Boolean)));
  const productObjectIds = getObjectIds(productIdKeys);

  const productOrQuery: any[] = [
    { id: { $in: productIdKeys } },
    { slug: { $in: productIdKeys.map(slugify) } },
  ];

  if (productObjectIds.length) {
    productOrQuery.push({ _id: { $in: productObjectIds } });
  }

  const product = await Product.findOne({
    $and: [activeStatusQuery(), { $or: productOrQuery }],
  })
    .select({
      _id: 1,
      id: 1,
      name: 1,
      title: 1,
      slug: 1,
      description: 1,
      image: 1,
      status: 1,
      sortOrder: 1,
      price: 1,
      numericPrice: 1,
      category: 1,
      categoryId: 1,
      categoryName: 1,
      categoryTitle: 1,
      categorySlug: 1,
      sizes: 1,
      modifierGroups: 1,
      attachedModifierGroups: 1,
      relatedUpsells: 1,
      upsell: 1,
      isPopular: 1,
      showInPopular: 1,
      popular: 1,
      featured: 1,
      updatedAt: 1,
      lastSavedAt: 1,
    })
    .lean<any>();

  const realProductKeys = Array.from(
    new Set(
      [product?._id ? String(product._id) : "", product?.id, product?.slug, cleanId]
        .map(cleanString)
        .filter(Boolean)
    )
  );

  const configProductIds: any[] = [...realProductKeys, ...getObjectIds(realProductKeys)];
  const configProductQueries = [
    buildFieldInQuery(ProductStoreConfig, "productId", configProductIds),
    buildFieldInQuery(ProductStoreConfig, "productID", configProductIds),
    buildFieldInQuery(ProductStoreConfig, "product_id", configProductIds),
    buildFieldInQuery(ProductStoreConfig, "product", configProductIds),
    buildFieldInQuery(ProductStoreConfig, "productSlug", realProductKeys.map(slugify)),
    buildFieldInQuery(ProductStoreConfig, "slug", realProductKeys.map(slugify)),
  ].filter(Boolean) as any[];

  const config = await ProductStoreConfig.findOne({
    $and: [
      buildStoreConfigQuery(storeValues),
      configProductQueries.length ? { $or: configProductQueries } : { productId: { $in: configProductIds } },
      activeStatusQuery(),
      availableQuery(),
    ],
  })
    .select({
      productId: 1,
      productID: 1,
      product_id: 1,
      product: 1,
      productSlug: 1,
      productName: 1,
      slug: 1,
      storeId: 1,
      store: 1,
      store_id: 1,
      storeSlug: 1,
      categoryId: 1,
      categoryName: 1,
      categorySlug: 1,
      price: 1,
      image: 1,
      description: 1,
      sizes: 1,
      modifierGroups: 1,
      attachedModifierGroups: 1,
      relatedUpsells: 1,
      upsell: 1,
      isPopular: 1,
      showInPopular: 1,
      sortOrder: 1,
      status: 1,
      updatedAt: 1,
    })
    .lean<any>();

  if (!product && !config) return null;

  const detail = buildFrontendProduct(cleanSlug, product || {}, config || {}, true);
  memSet(cacheKey, detail, DETAIL_CACHE_TTL_MS);

  return detail;
}
