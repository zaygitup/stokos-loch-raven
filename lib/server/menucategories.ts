import "server-only";

import { unstable_cache } from "next/cache";
import connectDB from "@/lib/mongodb";
import Category from "@/models/category";

export type FrontendMenuCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

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

function normalizeStoreId(value: unknown) {
  return cleanString(value).toLowerCase();
}

function isActiveQuery() {
  return {
    $or: [
      { status: "Active" },
      { status: "active" },
      { status: "Published" },
      { status: "published" },
      { status: "" },
      { status: { $exists: false } },
    ],
  };
}

function isVisibleCategory(category: any) {
  if (category?.hidden === true) return false;

  const status = cleanString(category?.status).toLowerCase();
  if (["inactive", "hidden", "disabled", "deleted"].includes(status)) {
    return false;
  }

  if (typeof category?.isActive === "boolean") return category.isActive;
  if (typeof category?.active === "boolean") return category.active;

  return true;
}

function normalizeCategoryFromCategoryDoc(
  category: any,
  fallbackSortOrder = 0
): FrontendMenuCategory | null {
  const name = cleanString(category?.name || category?.title);
  const slug = slugify(category?.slug || category?.id || category?._id || name);

  if (!name || !slug) return null;

  return {
    id: slug,
    name,
    slug,
    description: cleanString(category?.description),
    image: cleanString(category?.image || category?.imageUrl || category?.thumbnail),
    sortOrder: cleanNumber(category?.sortOrder ?? fallbackSortOrder),
  };
}

function uniqueBySlug(categories: FrontendMenuCategory[]) {
  const seen = new Set<string>();

  return categories.filter((category) => {
    const slug = slugify(category.slug || category.id || category.name);

    if (!slug || seen.has(slug)) return false;

    seen.add(slug);
    category.id = slug;
    category.slug = slug;
    return true;
  });
}

export async function getStoreMenuCategoriesFromDB(
  _storeSlug?: string
): Promise<FrontendMenuCategory[]> {
  await connectDB();

  // Important: frontend menu categories now come directly from the global
  // categories collection. They are NOT filtered by StoreMenu products and
  // NOT filtered by CategoryStoreConfig, so empty categories also show.
  const categories = await Category.find(isActiveQuery())
    .select({
      _id: 1,
      id: 1,
      name: 1,
      title: 1,
      slug: 1,
      description: 1,
      image: 1,
      imageUrl: 1,
      thumbnail: 1,
      sortOrder: 1,
      status: 1,
      isActive: 1,
      active: 1,
      hidden: 1,
      updatedAt: 1,
    })
    .sort({ sortOrder: 1, updatedAt: -1, name: 1 })
    .lean<any[]>();

  return uniqueBySlug(
    (Array.isArray(categories) ? categories : [])
      .filter(isVisibleCategory)
      .map((category, index) => normalizeCategoryFromCategoryDoc(category, index))
      .filter(Boolean) as FrontendMenuCategory[]
  ).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

const getCachedStoreMenuCategories = unstable_cache(
  async (_storeSlug: string) => getStoreMenuCategoriesFromDB(_storeSlug),
  ["store-menu-categories-global-v1"],
  {
    revalidate: 30,
    tags: ["store-menu-categories", "store-menu", "categories"],
  }
);

export async function getStoreMenuCategories(storeSlug: string) {
  return getCachedStoreMenuCategories(normalizeStoreId(storeSlug));
}
