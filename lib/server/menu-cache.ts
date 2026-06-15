import { revalidateTag } from "next/cache";

const IMMEDIATE_EXPIRY = { expire: 0 } as const;

export function invalidateMenuProducts() {
  revalidateTag("store-menu-products", IMMEDIATE_EXPIRY);
}

export function invalidateMenuCategories() {
  revalidateTag("store-menu-categories", IMMEDIATE_EXPIRY);
}
