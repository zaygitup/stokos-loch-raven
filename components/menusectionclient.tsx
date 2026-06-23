"use client";

import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

// The customer menu only changes when an admin edits it. Polling the full-menu
// endpoint every second per open tab was the main source of DB load. New page
// loads already get fresh data via ISR; already-open tabs pick up admin changes
// within this interval (and immediately on tab refocus via visibilitychange).
const MENU_POLL_INTERVAL_MS = 60_000;

const MenuSection = dynamic(() => import("@/components/menusection"), {
  ssr: false,
  loading: () => (
    <section className="mx-auto max-w-[1600px] px-4 py-10 text-black dark:text-white">
      <h2 className="text-2xl font-black">Loading menu...</h2>
    </section>
  ),
});

// Shared product modal, opened directly when the page is deep-linked with
// ?product=<slug> (e.g. from a home page Featured Deal "Order Deal" link).
const ProductModal = dynamic(() => import("@/components/ProductModal"), {
  ssr: false,
  loading: () => null,
});

type MenuCategoryTab = {
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
};

type StoreMenuApiData = {
  success?: boolean;
  store?: any;
  categories?: MenuCategoryTab[];
  menuCategories?: MenuCategoryTab[];
  products?: any[];
  menuProducts?: any[];
  modifierGroups?: any[];
  upsells?: any[];
  upsellProducts?: any[];
  updatedAt?: string;
};

interface MenuSectionsClientProps {
  storeSlug?: string;
  categories?: MenuCategoryTab[];
  initialProducts?: any[];
  initialMenuData?: StoreMenuApiData;
}

function pickNonEmptyArray<T>(first?: T[], second?: T[], third?: T[]) {
  if (Array.isArray(first) && first.length > 0) return first;
  if (Array.isArray(second) && second.length > 0) return second;
  if (Array.isArray(third) && third.length > 0) return third;
  return [];
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();

    if (["true", "yes", "1", "active", "popular", "featured"].includes(lower)) {
      return true;
    }
  }

  return false;
}

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryKey(category: MenuCategoryTab) {
  return slugify(category.slug || category.id || category.name || category.title);
}

function getCategoryTitle(category: MenuCategoryTab) {
  return cleanString(category.name || category.title || category.slug || category.id || "Menu");
}

function isPopularCategory(category: MenuCategoryTab) {
  const key = slugify(category.slug || category.id || category.name || category.title);

  return (
    key === "trending" ||
    key === "popular-menu-items" ||
    key === "popular-items" ||
    key === "popular-menu-item"
  );
}

function isProductPopular(product: any) {
  return (
    cleanBoolean(product?.isPopular) ||
    cleanBoolean(product?.showInPopular) ||
    cleanBoolean(product?.popular) ||
    cleanBoolean(product?.featured)
  );
}

function getProductCategoryKeys(product: any) {
  const keys = new Set<string>();

  const add = (value: unknown) => {
    const key = slugify(value);
    if (key) keys.add(key);
  };

  add(product?.category);
  add(product?.categoryId);
  add(product?.categorySlug);
  add(product?.categoryName);
  add(product?.categoryTitle);

  if (product?.category && typeof product.category === "object") {
    add(product.category._id);
    add(product.category.id);
    add(product.category.slug);
    add(product.category.name);
    add(product.category.title);
  }

  if (Array.isArray(product?.categories)) {
    product.categories.forEach((category: any) => {
      if (typeof category === "string") {
        add(category);
      } else {
        add(category?._id);
        add(category?.id);
        add(category?.slug);
        add(category?.name);
        add(category?.title);
      }
    });
  }

  if (Array.isArray(product?.categoryIds)) {
    product.categoryIds.forEach(add);
  }

  return keys;
}

function productBelongsToCategory(product: any, category: MenuCategoryTab) {
  const categoryKeys = [category.id, category.slug, category.name, category.title]
    .map((value) => slugify(value))
    .filter(Boolean);

  const productKeys = getProductCategoryKeys(product);

  return categoryKeys.some((key) => productKeys.has(key));
}

function getSlugFromParams(params: ReturnType<typeof useParams>) {
  const rawSlug = params?.slug;

  if (Array.isArray(rawSlug)) {
    return rawSlug[0] || "";
  }

  return typeof rawSlug === "string" ? rawSlug : "";
}

export default function MenuSectionsClient({
  storeSlug,
  categories = [],
  initialProducts = [],
  initialMenuData,
}: MenuSectionsClientProps) {
  const params = useParams();
  const routeSlug = getSlugFromParams(params);
  const resolvedStoreSlug = cleanString(storeSlug || routeSlug);

  const [clientMenuData, setClientMenuData] = useState<StoreMenuApiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const [deepLinkProduct, setDeepLinkProduct] = useState<any | null>(null);
  const handledProductParamRef = useRef<string | null>(null);

  const initialOnlyProducts = useMemo(() => {
    return pickNonEmptyArray(
      initialMenuData?.products,
      initialMenuData?.menuProducts,
      initialProducts
    );
  }, [initialMenuData, initialProducts]);

  const initialOnlyCategories = useMemo(() => {
    return pickNonEmptyArray(
      initialMenuData?.categories,
      initialMenuData?.menuCategories,
      categories
    );
  }, [initialMenuData, categories]);

  const hasInitialData = initialOnlyProducts.length > 0 && initialOnlyCategories.length > 0;

  const products = useMemo(() => {
    return pickNonEmptyArray(
      clientMenuData?.products,
      clientMenuData?.menuProducts,
      initialOnlyProducts
    );
  }, [clientMenuData, initialOnlyProducts]);

  const visibleCategories = useMemo(() => {
    return pickNonEmptyArray(
      clientMenuData?.categories,
      clientMenuData?.menuCategories,
      initialOnlyCategories
    );
  }, [clientMenuData, initialOnlyCategories]);

  useEffect(() => {
    if (!resolvedStoreSlug) return;

    let isMounted = true;
    let isFetching = false;
    let controller: AbortController | null = null;

    async function loadMenu(silent = true) {
      if (isFetching) return;

      isFetching = true;
      controller = new AbortController();

      if (!silent) {
        setIsLoading(true);
      }

      const menuUrl = `/api/store/${encodeURIComponent(
        resolvedStoreSlug
      )}/menu?_ts=${Date.now()}`;

      try {
        const response = await fetch(menuUrl, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Menu API failed with status ${response.status}`);
        }

        const data = (await response.json()) as StoreMenuApiData;

        if (isMounted) {
          setClientMenuData(data);
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Client menu API refresh error:", error);
        }
      } finally {
        isFetching = false;

        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMenu(hasInitialData);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadMenu(true);
      }
    }, MENU_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadMenu(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (controller) {
        controller.abort();
      }
    };
  }, [resolvedStoreSlug, hasInitialData]);

  // Open a product directly when deep-linked via ?product=<slug>.
  // The ref guard ensures a manual close is not undone by the menu poll
  // refreshing the products array (which would otherwise re-trigger this).
  useEffect(() => {
    if (!productParam) {
      handledProductParamRef.current = null;
      return;
    }

    if (handledProductParamRef.current === productParam) return;
    if (!products.length) return;

    const target = slugify(productParam);

    const match = products.find((product) =>
      [product?.slug, product?.id, product?.productId, product?.title, product?.name]
        .filter(Boolean)
        .some((value) => slugify(value) === target)
    );

    if (!match) return;

    handledProductParamRef.current = productParam;
    setDeepLinkProduct(match);
  }, [productParam, products]);

  if (!resolvedStoreSlug) return null;

  if (products.length === 0 && isLoading) {
    return (
      <section className="mx-auto max-w-[1600px] px-4 py-10 text-black dark:text-white">
        <h2 className="text-2xl font-black">Loading menu...</h2>
        <p className="mt-2 text-sm font-semibold opacity-70">
          Menu items load ho rahe hain.
        </p>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-[1600px] px-4 py-10 text-black dark:text-white">
        <h2 className="text-2xl font-black">No menu products found</h2>
        <p className="mt-2 text-sm font-semibold">
          Products empty aa rahi hain. API response mein products/menuProducts check karo.
        </p>
      </section>
    );
  }

  const renderedSections =
    visibleCategories.length === 0
      ? []
      : visibleCategories
          .map((category) => {
            const sectionProducts = isPopularCategory(category)
              ? products.filter((product) => isProductPopular(product))
              : products.filter((product) =>
                  productBelongsToCategory(product, category)
                );

            if (sectionProducts.length === 0) {
              return null;
            }

            const sectionId = getCategoryKey(category);

            return (
              <MenuSection
                key={sectionId}
                id={sectionId}
                title={getCategoryTitle(category)}
                subtitle={category.description || ""}
                products={sectionProducts}
              />
            );
          })
          .filter(Boolean);

  const menuContent =
    renderedSections.length === 0 ? (
      <MenuSection id="all-menu" title="Menu" subtitle="" products={products} />
    ) : (
      <>{renderedSections}</>
    );

  return (
    <>
      {menuContent}

      {deepLinkProduct ? (
        <ProductModal
          product={deepLinkProduct}
          isOpen={Boolean(deepLinkProduct)}
          onClose={() => setDeepLinkProduct(null)}
        />
      ) : null}
    </>
  );
}