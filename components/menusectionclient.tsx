"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MenuSection from "@/components/menusection";
import { useSearchStore } from "@/lib/data/useSearchStore";

export type MenuCategoryTab = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

type MenuSectionsClientProps = {
  storeSlug: string;
  categories?: MenuCategoryTab[] | null;
  initialProducts?: any[] | null;
};

// ✅ 60s polling — menu doesn't change every 10 seconds
const POLLING_MS = 60_000;

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

function getArrayFromApi(data: any, key: "products" | "categories") {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (key === "categories" && Array.isArray(data?.menuCategories)) return data.menuCategories;
  if (key === "products" && Array.isArray(data?.menuProducts)) return data.menuProducts;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function isExpectedNetworkError(error: any) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    error?.name === "AbortError" ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("load failed")
  );
}

function isPopularCategory(category: Partial<MenuCategoryTab>) {
  const id = slugify(category.id); const slug = slugify(category.slug); const name = slugify(category.name);
  return id === "trending" || slug === "trending" || name === "trending" ||
    name === "popular-menu-items" || name === "popular-items" || name === "popular-menu-item";
}
function isMenuCouponsCategory(category: Partial<MenuCategoryTab>) {
  return [category.id, category.slug, category.name].filter(Boolean)
    .map((v) => slugify(v)).some((key) => MENU_COUPON_CATEGORY_KEYS.has(key));
}
function normalizeCategory(category: Partial<MenuCategoryTab>): MenuCategoryTab {
  const name = cleanString(category.name);
  const cleanSlug = slugify(category.slug || category.id || name);
  return { id: cleanSlug, slug: cleanSlug, name, description: cleanString(category.description), image: cleanString(category.image), sortOrder: cleanNumber(category.sortOrder) };
}
function normalizeRealCategories(categories: Partial<MenuCategoryTab>[]) {
  const seen = new Set<string>();
  return (Array.isArray(categories) ? categories : [])
    .map((c) => normalizeCategory(c))
    .filter((c) => {
      if (!c.id || !c.name) return false;
      if (isPopularCategory(c)) return false;
      if (isMenuCouponsCategory(c)) return false;
      const key = slugify(c.slug || c.id || c.name);
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}
function getProductCategoryName(product: any) {
  if (typeof product?.category === "string") return product.category;
  return cleanString(product?.categoryName || product?.categoryTitle || product?.category?.name || product?.category?.title || "");
}
function getProductCategorySlug(product: any) {
  if (typeof product?.category === "string") return slugify(product.category);
  return slugify(product?.categorySlug || product?.categoryId || product?.category?.slug || product?.category?.id || product?.category?._id || getProductCategoryName(product));
}
function deriveCategoriesFromProducts(products: any[]): MenuCategoryTab[] {
  const seen = new Set<string>();
  return (Array.isArray(products) ? products : [])
    .map((p) => {
      const categoryName = getProductCategoryName(p);
      const categorySlug = getProductCategorySlug(p);
      return { id: categorySlug, slug: categorySlug, name: categoryName || categorySlug, description: "", image: "", sortOrder: cleanNumber(p?.categorySortOrder || 9999) };
    })
    .filter((c) => {
      if (!c.id || !c.name) return false;
      if (isPopularCategory(c)) return false;
      if (isMenuCouponsCategory(c)) return false;
      if (seen.has(c.id)) return false;
      seen.add(c.id); return true;
    });
}
function buildMenuCategories(inputCategories: Partial<MenuCategoryTab>[], products: any[]) {
  const seen = new Set<string>();
  const realCategories = [
    ...normalizeRealCategories(inputCategories),
    ...deriveCategoriesFromProducts(products),
  ].filter((c) => {
    const key = slugify(c.slug || c.id || c.name);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  return [POPULAR_CATEGORY, ...realCategories];
}
function getCategorySectionId(category: MenuCategoryTab) {
  return slugify(category.slug || category.id || category.name);
}
function getProductCategoryKeys(product: any) {
  const categoryString = typeof product?.category === "string" ? product.category : "";
  return [product?.categoryId, product?.categorySlug, product?.categoryName, product?.categoryTitle, categoryString, product?.category?.id, product?.category?._id, product?.category?.slug, product?.category?.name, product?.category?.title]
    .filter(Boolean).map((v) => slugify(v));
}
function productBelongsToCategory(product: any, category: MenuCategoryTab) {
  const categoryKeys = [category.id, category.slug, category.name, getCategorySectionId(category)].filter(Boolean).map((v) => slugify(v));
  return categoryKeys.some((key) => getProductCategoryKeys(product).includes(key));
}
function isProductPopular(product: any) {
  return cleanBoolean(product?.isPopular) || cleanBoolean(product?.showInPopular) || cleanBoolean(product?.popular) || cleanBoolean(product?.featured);
}
function isProductActive(product: any) {
  const status = cleanString(product?.status || "Active").toLowerCase();
  return !status || status === "active" || status === "published" || status === "available";
}
function normalizeProduct(product: any, storeSlug: string) {
  const title = cleanString(product?.title || product?.name || "Menu Item");
  const productId = cleanString(product?.id || product?.productId || product?._id || product?.slug || slugify(title));
  const categoryName = getProductCategoryName(product);
  const categorySlug = getProductCategorySlug(product);
  const price = cleanNumber(product?.price ?? product?.numericPrice);
  return {
    ...product, id: productId, productId: cleanString(product?.productId || productId),
    slug: cleanString(product?.slug || slugify(title)), title, name: title,
    description: cleanString(product?.description),
    image: cleanString(product?.image || "/images/placeholder-food.png"),
    price, numericPrice: cleanNumber(product?.numericPrice ?? price),
    categoryId: cleanString(product?.categoryId || categorySlug), categoryName, categorySlug,
    category: categorySlug || categoryName, storeSlug: cleanString(product?.storeSlug || storeSlug),
    sortOrder: cleanNumber(product?.sortOrder), isPopular: isProductPopular(product),
    showInPopular: isProductPopular(product), status: cleanString(product?.status || "Active"),
  };
}
function normalizeProducts(products: any[], storeSlug: string) {
  return (Array.isArray(products) ? products : [])
    .map((p) => normalizeProduct(p, storeSlug))
    .filter((p) => {
      if (!p.id || !p.title) return false;
      if (!isProductActive(p)) return false;
      const categoryKey = slugify(p.categorySlug || p.categoryName || p.category);
      if (MENU_COUPON_CATEGORY_KEYS.has(categoryKey)) return false;
      return true;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}
function productsChanged(oldProducts: any[], newProducts: any[]) {
  const sig = (arr: any[]) => JSON.stringify(arr.map((p) => ({ id: p.id, productId: p.productId, title: p.title, price: p.price, categoryId: p.categoryId, categoryName: p.categoryName, categorySlug: p.categorySlug, isPopular: p.isPopular, showInPopular: p.showInPopular, sortOrder: p.sortOrder, status: p.status, updatedAt: p.updatedAt })));
  return sig(oldProducts) !== sig(newProducts);
}
function categoriesChanged(oldCategories: MenuCategoryTab[], newCategories: MenuCategoryTab[]) {
  return JSON.stringify(oldCategories) !== JSON.stringify(newCategories);
}

// ✅ NO cache: "no-store", NO ?t=Date.now() — let s-maxage=30 work
async function fetchJson(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { method: "GET", signal });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export default function MenuSectionsClient({
  storeSlug,
  categories = [],
  initialProducts = [],
}: MenuSectionsClientProps) {
  const { searchQuery } = useSearchStore();
  const controllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);

  const initialNormalizedProducts = useMemo(
    () => normalizeProducts(initialProducts || [], storeSlug),
    [initialProducts, storeSlug]
  );
  const initialMenuCategories = useMemo(
    () => buildMenuCategories(categories || [], initialNormalizedProducts),
    [categories, initialNormalizedProducts]
  );

  const [menuCategories, setMenuCategories] = useState<MenuCategoryTab[]>(initialMenuCategories);
  const [products, setProducts] = useState<any[]>(initialNormalizedProducts);
  const [loading, setLoading] = useState(initialNormalizedProducts.length === 0);

  useEffect(() => { setProducts(initialNormalizedProducts); }, [initialNormalizedProducts]);
  useEffect(() => { setMenuCategories(initialMenuCategories); }, [initialMenuCategories]);

  const loadLatestMenu = useCallback(async () => {
    if (!storeSlug) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const [categoriesData, productsData] = await Promise.all([
        fetchJson(`/api/store/${encodeURIComponent(storeSlug)}/menu-categories`, controller.signal),
        fetchJson(`/api/store/${encodeURIComponent(storeSlug)}/menu-products`, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const latestProducts = normalizeProducts(getArrayFromApi(productsData, "products"), storeSlug);
      const latestCategories = buildMenuCategories(getArrayFromApi(categoriesData, "categories"), latestProducts);

      setProducts((cur) => productsChanged(cur, latestProducts) ? latestProducts : cur);
      setMenuCategories((cur) => categoriesChanged(cur, latestCategories) ? latestCategories : cur);
    } catch (error: any) {
      if (isExpectedNetworkError(error)) return;
      console.error("Menu refresh failed:", error);
    } finally {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        setLoading(false);
      }
    }
  }, [storeSlug]);

  useEffect(() => {
    if (!storeSlug) return;
    loadLatestMenu();
    const interval = window.setInterval(loadLatestMenu, POLLING_MS);
    return () => { controllerRef.current?.abort(); window.clearInterval(interval); };
  }, [storeSlug, loadLatestMenu]);

  const visibleCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return menuCategories;
    return menuCategories.filter((category) => {
      if (isPopularCategory(category)) {
        return products.some((p) => isProductPopular(p) && cleanString(p.title || p.name).toLowerCase().includes(q));
      }
      return products.some((p) => productBelongsToCategory(p, category) && cleanString(p.title || p.name).toLowerCase().includes(q));
    });
  }, [menuCategories, products, searchQuery]);

  if (loading && products.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-5 md:px-6 xl:px-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-[#121212]">
          <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Loading menu...</p>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-5 md:px-6 xl:px-10">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-[#121212]">
          <p className="text-sm font-black uppercase tracking-widest text-zinc-500">No products found for this store.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {visibleCategories.map((category) => {
        const isPopular = isPopularCategory(category);
        const sectionProducts = isPopular
          ? products.filter((p) => isProductPopular(p))
          : products.filter((p) => productBelongsToCategory(p, category));
        if (!sectionProducts.length) return null;
        return (
          <MenuSection
            key={category.id}
            id={getCategorySectionId(category)}
            title={category.name}
            subtitle={category.description || ""}
            products={sectionProducts}
          />
        );
      })}
    </>
  );
}
