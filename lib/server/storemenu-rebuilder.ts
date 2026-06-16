import "server-only";

import connectDB from "@/lib/mongodb";
import StoreMenu from "@/models/storemenu";
import {
  clearStoreMenuProductsCache,
  getStoreMenuProducts,
} from "@/lib/server/menuproducts";

export type MenuCategoryTab = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

type DbProduct = {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  category?: any;
  categoryId?: string;
  categoryName?: string;
  categoryTitle?: string;
  categorySlug?: string;
  categorySortOrder?: number;
  sortOrder?: number;
  isPopular?: boolean;
  showInPopular?: boolean;
  popular?: boolean;
  featured?: boolean;
};

const POPULAR_CATEGORY: MenuCategoryTab = {
  id: "trending",
  slug: "trending",
  name: "Popular Menu Items",
  description: "",
  image: "",
  sortOrder: -1,
};

const DEFAULT_CATEGORY: MenuCategoryTab = {
  id: "menu-items",
  slug: "menu-items",
  name: "Menu Items",
  description: "",
  image: "",
  sortOrder: 9999,
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

function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (["true", "yes", "1", "active", "popular", "featured"].includes(lower)) return true;
    if (["false", "no", "0", "inactive", "off", "hidden"].includes(lower)) return false;
  }

  return fallback;
}

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPopularCategory(category: Partial<MenuCategoryTab>) {
  const id = slugify(category.id);
  const slug = slugify(category.slug);
  const name = slugify(category.name);

  return (
    id === "trending" ||
    slug === "trending" ||
    name === "trending" ||
    name === "popular-menu-items" ||
    name === "popular-items" ||
    name === "popular-menu-item"
  );
}

function isMenuCouponsCategory(category: Partial<MenuCategoryTab>) {
  return [category.id, category.slug, category.name]
    .filter(Boolean)
    .map((value) => slugify(value))
    .some((key) => MENU_COUPON_CATEGORY_KEYS.has(key));
}

function isProductPopular(product: DbProduct) {
  return (
    cleanBoolean(product?.isPopular) ||
    cleanBoolean(product?.showInPopular) ||
    cleanBoolean(product?.popular) ||
    cleanBoolean(product?.featured)
  );
}

function getProductCategoryName(product: DbProduct) {
  if (typeof product?.category === "string") return cleanString(product.category);

  return cleanString(
    product?.categoryName ||
      product?.categoryTitle ||
      product?.category?.name ||
      product?.category?.title ||
      ""
  );
}

function getProductCategorySlug(product: DbProduct) {
  if (typeof product?.category === "string") return slugify(product.category);

  return slugify(
    product?.categorySlug ||
      product?.category?.slug ||
      product?.category?.id ||
      product?.category?._id ||
      getProductCategoryName(product) ||
      product?.categoryId
  );
}

export function buildSnapshotCategories(products: DbProduct[]) {
  const seen = new Set<string>();

  const realCategories = (Array.isArray(products) ? products : [])
    .map((product) => {
      const categoryName = getProductCategoryName(product);
      const categorySlug = getProductCategorySlug(product) || "menu-items";

      return {
        id: categorySlug,
        slug: categorySlug,
        name: categoryName || categorySlug.replace(/-/g, " ") || "Menu Items",
        description: "",
        image: "",
        sortOrder: cleanNumber(product?.categorySortOrder || product?.sortOrder || 9999),
      };
    })
    .filter((category) => {
      if (!category.id || !category.name) return false;
      if (isPopularCategory(category)) return false;
      if (isMenuCouponsCategory(category)) return false;

      const key = slugify(category.slug || category.id || category.name);
      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const hasPopularProducts = (Array.isArray(products) ? products : []).some(isProductPopular);

  const finalCategories: MenuCategoryTab[] = realCategories.length ? realCategories : [];
  if (!finalCategories.length && Array.isArray(products) && products.length) {
    finalCategories.push(DEFAULT_CATEGORY);
  }

  return hasPopularProducts ? [POPULAR_CATEGORY, ...finalCategories] : finalCategories;
}

export async function rebuildStoreMenu(storeSlug: string, reason = "admin-change") {
  const cleanStoreSlug = slugify(storeSlug);

  if (!cleanStoreSlug) {
    throw new Error("Store slug is required to rebuild store menu snapshot.");
  }

  await connectDB();

  try {
    await StoreMenu.findOneAndUpdate(
      { storeSlug: cleanStoreSlug },
      {
        $set: {
          storeSlug: cleanStoreSlug,
          status: "building",
          "meta.rebuiltReason": reason,
          "meta.errorMessage": "",
          "meta.lastFailedAt": null,
        },
      },
      { upsert: true, returnDocument: "after" }
    ).lean<any>();

    // Important: rebuild must not use stale in-memory product cache.
    clearStoreMenuProductsCache(cleanStoreSlug);

    const products = await getStoreMenuProducts(cleanStoreSlug);
    const categories = buildSnapshotCategories(products || []);
    const now = new Date();

    const snapshot = await StoreMenu.findOneAndUpdate(
      { storeSlug: cleanStoreSlug },
      {
        $set: {
          storeSlug: cleanStoreSlug,
          status: "ready",
          categories,
          products,
          menuProducts: products,
          meta: {
            productCount: products.length,
            categoryCount: categories.length,
            rebuiltReason: reason,
            errorMessage: "",
            lastFailedAt: null,
          },
          builtAt: now,
        },
        $inc: { version: 1 },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    ).lean<any>();

    return {
      storeSlug: cleanStoreSlug,
      categories,
      products,
      menuProducts: products,
      version: snapshot?.version || 1,
      builtAt: snapshot?.builtAt || now,
      status: "ready",
    };
  } catch (error: any) {
    await StoreMenu.findOneAndUpdate(
      { storeSlug: cleanStoreSlug },
      {
        $set: {
          status: "failed",
          "meta.rebuiltReason": reason,
          "meta.errorMessage": error?.message || "Snapshot rebuild failed",
          "meta.lastFailedAt": new Date(),
        },
      },
      {
        upsert: false,
        returnDocument: "after",
      }
    ).catch(() => null);

    throw error;
  }
}
