import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { clearStoreMenuProductsCache } from "@/lib/server/menuproducts";

function cleanSlug(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const IMMEDIATE_EXPIRY = { expire: 0 } as const;

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, IMMEDIATE_EXPIRY);
  } catch (error) {
    console.error(`Failed to revalidate tag "${tag}":`, error);
  }
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.error(`Failed to revalidate path "${path}":`, error);
  }
}

export function invalidateMenuProducts(storeSlug?: string) {
  clearStoreMenuProductsCache(storeSlug);
  safeRevalidateTag("store-menu-products");
  safeRevalidateTag("store-menu");
}

export function invalidateMenuCategories() {
  safeRevalidateTag("store-menu-categories");
  safeRevalidateTag("store-menu");
}

export function invalidateStoreMenu(storeSlug?: string) {
  const slug = cleanSlug(storeSlug);

  invalidateMenuProducts(slug);
  invalidateMenuCategories();

  if (slug) {
    safeRevalidateTag(`store-menu:${slug}`);
    safeRevalidateTag(`store-menu-products:${slug}`);
    safeRevalidateTag(`store-menu-categories:${slug}`);
    safeRevalidatePath(`/store/${slug}`);
  }
}
