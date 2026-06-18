import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { clearStoreMenuProductsCache } from "@/lib/server/menuproducts";

const IMMEDIATE_EXPIRY = { expire: 0 } as const;

function cleanSlug(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  const slug = cleanSlug(storeSlug);

  clearStoreMenuProductsCache(slug);
  safeRevalidateTag("store-menu-products");
  safeRevalidateTag("store-menu");

  if (slug) {
    safeRevalidateTag(`store-menu:${slug}`);
    safeRevalidateTag(`store-menu-products:${slug}`);
  }
}

export function invalidateMenuCategories(storeSlug?: string) {
  const slug = cleanSlug(storeSlug);

  safeRevalidateTag("store-menu-categories");
  safeRevalidateTag("store-menu");

  if (slug) {
    safeRevalidateTag(`store-menu:${slug}`);
    safeRevalidateTag(`store-menu-categories:${slug}`);
  }
}

export function invalidateStoreMenu(storeSlug?: string) {
  const slug = cleanSlug(storeSlug);

  invalidateMenuProducts(slug);
  invalidateMenuCategories(slug);

  if (slug) {
    safeRevalidatePath(`/store/${slug}`);
  }
}
