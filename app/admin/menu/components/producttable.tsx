"use client";

import type { Category, Product } from "../types";
import { ActionButtons, EmptyBox, ImageBox, StatusBadge, TableHead } from "./ui";

type StoreItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
};

type MongoObject = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  offer?: string;
  slug?: string;
};

type ProductStoreConfig = {
  _id?: string;
  id?: string;
  storeId?: string;
  category?: unknown;
  categoryId?: unknown;
  categoryName?: unknown;
  price?: number;
  sizes?: Array<{ name?: string; price?: number }>;
  modifierGroups?: unknown[];
  upsell?: unknown;
  status?: string;
  sortOrder?: number;
};

function getItemId(item: unknown, fallback: string) {
  if (typeof item === "object" && item !== null) {
    const obj = item as MongoObject;
    return String(obj._id || obj.id || obj.slug || fallback);
  }

  return fallback;
}

function getTextValue(value: unknown, fallback = "Not selected") {
  if (!value) return fallback;

  if (typeof value === "string") return value.trim();

  if (typeof value === "number") return String(value);

  if (typeof value === "object") {
    const obj = value as MongoObject;

    return String(
      obj.name || obj.title || obj.offer || obj.slug || obj._id || obj.id || fallback
    ).trim();
  }

  return fallback;
}

function normalizeValue(value: unknown) {
  return getTextValue(value, "").trim().toLowerCase();
}

function getStoreVariants(store: StoreItem) {
  return [store.slug, store._id, store.id, store.name]
    .filter(Boolean)
    .map((value) => String(value).trim());
}

function getStoreConfigs(product: Product): ProductStoreConfig[] {
  return Array.isArray((product as any).storeConfigs)
    ? ((product as any).storeConfigs as ProductStoreConfig[])
    : [];
}

function getProductConfig(product: Product, selectedStoreId?: string) {
  const configs = getStoreConfigs(product);

  if (!configs.length) return null;

  if (selectedStoreId && selectedStoreId !== "all") {
    const found = configs.find(
      (config) => String(config.storeId || "").trim() === selectedStoreId
    );

    if (found) return found;
  }

  return configs[0];
}

function normalizeStoreValue(value: unknown) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value === "object") {
    const obj = value as MongoObject;
    return String(obj.slug || obj._id || obj.id || obj.name || "").trim();
  }

  return "";
}

function getItemStoreId(item: unknown) {
  if (!item || typeof item !== "object") return "";

  const obj = item as {
    storeId?: unknown;
    storeSlug?: unknown;
    store?: unknown;
  };

  return (
    normalizeStoreValue(obj.storeId) ||
    normalizeStoreValue(obj.storeSlug) ||
    normalizeStoreValue(obj.store)
  );
}

function isSameStore(
  firstStoreId: string,
  secondStoreId: string,
  stores: StoreItem[]
) {
  if (!firstStoreId || !secondStoreId) return false;

  if (firstStoreId === secondStoreId) return true;

  return stores.some((store) => {
    const variants = getStoreVariants(store);
    return variants.includes(firstStoreId) && variants.includes(secondStoreId);
  });
}

function getStoreName(stores: StoreItem[], product: Product, selectedStoreId?: string) {
  const configs = getStoreConfigs(product);

  if (selectedStoreId && selectedStoreId !== "all") {
    const config = getProductConfig(product, selectedStoreId);
    const storeId = String(config?.storeId || getItemStoreId(product) || "").trim();

    if (!storeId) return "No Store";

    const foundStore = stores.find((store) => {
      const variants = getStoreVariants(store);
      return variants.includes(storeId);
    });

    return foundStore?.name || storeId;
  }

  if (configs.length > 1) return `${configs.length} Stores`;

  const storeId = String(configs[0]?.storeId || getItemStoreId(product) || "").trim();

  if (!storeId) return "No Store";

  const foundStore = stores.find((store) => {
    const variants = getStoreVariants(store);
    return variants.includes(storeId);
  });

  return foundStore?.name || storeId;
}

function categoryMatchesValue(category: Category, value: string) {
  if (!value) return false;

  const categoryObj = category as Category & {
    _id?: string;
    id?: string;
    slug?: string;
  };

  const categoryValues = [
    categoryObj._id,
    categoryObj.id,
    categoryObj.name,
    categoryObj.slug,
  ]
    .map((item) => normalizeValue(item))
    .filter(Boolean);

  return categoryValues.includes(value);
}

function getProductCategoryName(
  categories: Category[],
  product: Product,
  stores: StoreItem[],
  selectedStoreId?: string
) {
  const config = getProductConfig(product, selectedStoreId);

  const productObj = (config || product) as Product & {
    category?: unknown;
    categoryId?: unknown;
    categoryName?: unknown;
    categorySlug?: unknown;
  };

  const directCategoryName = String(productObj.categoryName || "").trim();

  if (directCategoryName) return directCategoryName;

  const productStoreId = String(config?.storeId || getItemStoreId(product) || "").trim();

  const productCategoryValues = [
    productObj.categoryId,
    productObj.category,
    productObj.categorySlug,
  ]
    .map((item) => normalizeValue(item))
    .filter(Boolean);

  const fallbackCategory =
    getTextValue(productObj.categoryName, "") ||
    getTextValue(productObj.category, "") ||
    getTextValue(productObj.categoryId, "No Category");

  const sameStoreCategory = categories.find((category) => {
    const categoryStoreId = getItemStoreId(category);

    const matchesCategory = productCategoryValues.some((value) =>
      categoryMatchesValue(category, value)
    );

    const matchesStore =
      !productStoreId ||
      !categoryStoreId ||
      isSameStore(productStoreId, categoryStoreId, stores);

    return matchesCategory && matchesStore;
  });

  if (sameStoreCategory?.name) return sameStoreCategory.name;

  const anyCategory = categories.find((category) =>
    productCategoryValues.some((value) => categoryMatchesValue(category, value))
  );

  return anyCategory?.name || fallbackCategory;
}

function getProductPriceLabel(product: Product, selectedStoreId?: string) {
  const configs = getStoreConfigs(product);

  if (configs.length > 0 && (!selectedStoreId || selectedStoreId === "all")) {
    const prices = configs.map((config) => Number(config.price || 0));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) return `$${minPrice.toFixed(2)}`;

    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }

  const config = getProductConfig(product, selectedStoreId);
  const source = config || product;
  const sizes = Array.isArray((source as any).sizes)
    ? ((source as any).sizes as Array<{ name?: string; price?: number }>)
    : [];

  const cleanSizes = sizes
    .map((size) => ({
      name: String(size.name || "").trim(),
      price: Number(size.price || 0),
    }))
    .filter((size) => size.name);

  if (cleanSizes.length > 1) {
    const prices = cleanSizes.map((size) => size.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) return `$${minPrice.toFixed(2)}`;

    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }

  return `$${Number((source as any).price || cleanSizes[0]?.price || 0).toFixed(2)}`;
}

function getProductSizeCount(product: Product, selectedStoreId?: string) {
  const config = getProductConfig(product, selectedStoreId);
  const source = config || product;
  const sizes = Array.isArray((source as any).sizes)
    ? ((source as any).sizes as unknown[])
    : [];

  return sizes.length;
}

function getProductModifierGroups(product: Product, selectedStoreId?: string) {
  const config = getProductConfig(product, selectedStoreId);
  const source = config || product;

  return Array.isArray((source as any).modifierGroups)
    ? ((source as any).modifierGroups as unknown[])
    : [];
}

function getProductStatus(product: Product, selectedStoreId?: string) {
  const config = getProductConfig(product, selectedStoreId);
  return String(config?.status || product.status || "Active");
}

function getProductUpsell(product: Product, selectedStoreId?: string) {
  const config = getProductConfig(product, selectedStoreId);
  return getTextValue((config || product as any).upsell, "No upsell");
}

export default function ProductTable({
  products,
  categories = [],
  stores = [],
  selectedStoreId = "all",
  onEdit,
  onDelete,
}: {
  products: Product[];
  categories?: Category[];
  stores?: StoreItem[];
  selectedStoreId?: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  if (!products.length) return <EmptyBox message="No products found." />;

  return (
    <div className="overflow-hidden rounded-[26px] border border-zinc-200">
      <div className="border-b border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-lg font-black">Products</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Product is global. Store-wise category, prices, sizes, modifiers, status, and order come from store configs.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left">
          <thead className="border-b border-zinc-200 bg-white">
            <tr>
              <TableHead>Product</TableHead>
              <TableHead>Store Config</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Modifiers</TableHead>
              <TableHead>Upsell</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {products.map((product, index) => {
              const productId = getItemId(
                product,
                `${product.name || "product"}-${index}`
              );

              const categoryName = getProductCategoryName(
                categories,
                product,
                stores,
                selectedStoreId
              );

              const storeName = getStoreName(stores, product, selectedStoreId);
              const upsellName = getProductUpsell(product, selectedStoreId);
              const modifierGroups = getProductModifierGroups(product, selectedStoreId);

              return (
                <tr key={productId} className="transition hover:bg-green-50/50">
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <ImageBox src={product.image} alt={product.name} />

                      <div>
                        <p className="font-black text-zinc-950">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-zinc-500">
                          Master product
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-800">
                      {storeName}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-700">
                      {categoryName}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <div className="text-sm font-black">
                      {getProductPriceLabel(product, selectedStoreId)}
                    </div>

                    {getProductSizeCount(product, selectedStoreId) > 1 && (
                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        {getProductSizeCount(product, selectedStoreId)} sizes
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex max-w-[280px] flex-wrap gap-2">
                      {modifierGroups.length ? (
                        modifierGroups.map((group, groupIndex) => {
                          const groupLabel = getTextValue(
                            group,
                            "Modifier Group"
                          );

                          const groupId = getItemId(
                            group,
                            `${groupLabel}-${groupIndex}`
                          );

                          return (
                            <span
                              key={groupId}
                              className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800"
                            >
                              {groupLabel}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs font-semibold text-zinc-400">
                          No modifiers
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-5 text-sm font-semibold text-zinc-600">
                    {upsellName}
                  </td>

                  <td className="px-5 py-5">
                    <StatusBadge status={getProductStatus(product, selectedStoreId)} />
                  </td>

                  <td className="px-5 py-5">
                    <ActionButtons
                      onEdit={() => onEdit(product)}
                      onDelete={() => onDelete(productId)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
