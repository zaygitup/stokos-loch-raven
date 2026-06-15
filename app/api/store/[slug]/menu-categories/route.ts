import { NextResponse } from "next/server";
import { getStoreMenuCategories } from "@/lib/server/menucategories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = {
  params: Promise<{ slug: string }>;
};

type DbCategory = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

type MenuCategoryTab = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
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
  "menu-coupons","menu-coupon","menu-coupon-category",
  "coupons","coupon","deals","deal","menu-deals","menu-deal",
]);

function slugify(value: unknown) {
  return String(value || "").toLowerCase().trim()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isPopularCategory(category: Partial<DbCategory | MenuCategoryTab>) {
  const id = slugify(category.id); const slug = slugify(category.slug); const name = slugify(category.name);
  return id === "trending" || slug === "trending" || name === "trending" ||
    name === "popular-menu-items" || name === "popular-items" || name === "popular-menu-item";
}

function isMenuCouponsCategory(category: Partial<DbCategory | MenuCategoryTab>) {
  return [category.id, category.slug, category.name].filter(Boolean)
    .map((v) => slugify(v)).some((key) => MENU_COUPON_CATEGORY_KEYS.has(key));
}

function normalizeCategory(category: DbCategory): MenuCategoryTab {
  const name = String(category.name || "").trim();
  const cleanSlug = slugify(category.slug || category.id || category._id || name);
  return { id: cleanSlug, slug: cleanSlug, name, description: String(category.description || ""), image: String(category.image || ""), sortOrder: Number(category.sortOrder || 0) };
}

function buildCategories(dbCategories: DbCategory[]) {
  const seen = new Set<string>();
  const realCategories = dbCategories
    .filter((c) => !isPopularCategory(c))
    .map((c) => normalizeCategory(c))
    .filter((c) => {
      if (isMenuCouponsCategory(c)) return false;
      const key = slugify(c.slug || c.id || c.name);
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  return [POPULAR_CATEGORY, ...realCategories];
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, categories: [], menuCategories: [], message: "Store slug is required." }, { status: 400 });
    }

    const dbCategories = await getStoreMenuCategories(slug);
    const categories = buildCategories(dbCategories || []);

    return NextResponse.json(
      { success: true, categories, menuCategories: categories, updatedAt: new Date().toISOString() },
      {
        status: 200,
        headers: {
          // ✅ 30s CDN/browser cache — unstable_cache already handles DB caching
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Store menu categories GET error:", error);
    return NextResponse.json(
      { success: false, categories: [], menuCategories: [], message: "Failed to load categories." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
