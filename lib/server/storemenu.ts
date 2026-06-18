import "server-only";

import { getStoreMenuCategories } from "@/lib/server/menucategories";
import { getStoreMenuProducts } from "@/lib/server/menuproducts";

type DbCategory = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

export type MenuCategoryTab = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
};

export type StoreMenuApiData = {
  success: boolean;
  store: { slug: string } | null;
  categories: MenuCategoryTab[];
  menuCategories: MenuCategoryTab[];
  products: any[];
  menuProducts: any[];
  modifierGroups: any[];
  upsells: any[];
  upsellProducts: any[];
  counts: {
    categories: number;
    products: number;
    modifierGroups: number;
    upsells: number;
  };
  updatedAt: string;
};

type StoreMenuPayloadOptions = {
  bypassProductCache?: boolean;
};

const POPULAR_CATEGORY: MenuCategoryTab = {
  id: "trending",
  slug: "trending",
  name: "Popular Menu Items",
  description: "",
  image: "",
  sortOrder: -1,
};

const MENU_COUPON_CATEGORY_KEYS = new Set([
  "menu-coupons",
  "menu-coupon",
  "menu-coupon-category",
  "coupons",
  "coupon",
  "deals",
  "deal",
  "menu-deals",
  "menu-deal",
]);

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const number = Number(cleanString(value).replace(/[^0-9.-]/g, "") || 0);
  return Number.isFinite(number) ? number : 0;
}

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPopularCategory(category: Partial<DbCategory | MenuCategoryTab>) {
  const id = slugify(category.id);
  const slug = slugify(category.slug);
  const name = slugify(category.name || (category as DbCategory).title);

  return (
    id === "trending" ||
    slug === "trending" ||
    name === "trending" ||
    name === "popular-menu-items" ||
    name === "popular-items" ||
    name === "popular-menu-item"
  );
}

function isMenuCouponsCategory(category: Partial<DbCategory | MenuCategoryTab>) {
  return [
    category.id,
    category.slug,
    category.name,
    (category as DbCategory).title,
  ]
    .filter(Boolean)
    .map((value) => slugify(value))
    .some((key) => MENU_COUPON_CATEGORY_KEYS.has(key));
}

function normalizeCategory(category: DbCategory): MenuCategoryTab {
  const name = cleanString(category.name || category.title);
  const cleanSlug = slugify(category.slug || category.id || category._id || name);

  return {
    id: cleanSlug,
    slug: cleanSlug,
    name,
    description: cleanString(category.description),
    image: cleanString(category.image),
    sortOrder: cleanNumber(category.sortOrder),
  };
}

function buildCategories(dbCategories: DbCategory[]) {
  const seen = new Set<string>();

  const realCategories = (Array.isArray(dbCategories) ? dbCategories : [])
    .filter((category) => !isPopularCategory(category))
    .map((category) => normalizeCategory(category))
    .filter((category) => {
      if (isMenuCouponsCategory(category)) return false;

      const key = slugify(category.slug || category.id || category.name);
      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  return [POPULAR_CATEGORY, ...realCategories];
}

async function getFreshStoreProducts(storeSlug: string, bypassCache: boolean) {
  // Cast keeps this file compatible even if your older menuproducts.ts only typed 1 argument.
  // The v2 menuproducts.ts supports { bypassCache: true } and will bypass memory cache.
  const getProducts = getStoreMenuProducts as unknown as (
    slug: string,
    options?: { bypassCache?: boolean }
  ) => Promise<any[]>;

  return getProducts(storeSlug, { bypassCache });
}

export async function getStoreMenuPayload(
  storeSlug: string,
  options: StoreMenuPayloadOptions = {}
): Promise<StoreMenuApiData> {
  const cleanSlug = slugify(storeSlug);

  if (!cleanSlug) {
    return {
      success: false,
      store: null,
      categories: [],
      menuCategories: [],
      products: [],
      menuProducts: [],
      modifierGroups: [],
      upsells: [],
      upsellProducts: [],
      counts: {
        categories: 0,
        products: 0,
        modifierGroups: 0,
        upsells: 0,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  const bypassProductCache = options.bypassProductCache !== false;

  // Fresh customer API payload. Do not wrap this in unstable_cache.
  const [rawCategories, rawProducts] = await Promise.all([
    getStoreMenuCategories(cleanSlug),
    getFreshStoreProducts(cleanSlug, bypassProductCache),
  ]);

  const categories = buildCategories(
    Array.isArray(rawCategories) ? rawCategories : []
  );

  const products = Array.isArray(rawProducts) ? rawProducts : [];

  return {
    success: true,
    store: { slug: cleanSlug },
    categories,
    menuCategories: categories,
    products,
    menuProducts: products,
    modifierGroups: [],
    upsells: [],
    upsellProducts: [],
    counts: {
      categories: categories.length,
      products: products.length,
      modifierGroups: 0,
      upsells: 0,
    },
    updatedAt: new Date().toISOString(),
  };
}

// Keep this export name so page.tsx does not break, but DO NOT use unstable_cache here.
// Old 30s unstable_cache was the main reason customer menu stayed stale.
export async function getCachedStoreMenuPayload(
  storeSlug: string
): Promise<StoreMenuApiData> {
  return getStoreMenuPayload(storeSlug, { bypassProductCache: true });
}
