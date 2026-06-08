"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import type {
  Category,
  ModifierGroup,
  ModifierOption,
  Product,
  ProductModifierGroup,
  ProductModifierOption,
  ProductSize,
  ProductStatus,
  UpsellRule,
} from "../menu/types";

import { FormInput, FormSelect } from "../menu/components/ui";
import ImageUploadBox from "../adminmenumodel/imageuploadbox";
import {
  getSafeId,
  getTextValue,
  normalizeStringArray,
} from "../utils/menuhelpers";

export type ProductFormRef = {
  submit: () => void;
};

type StoreItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  status?: string;
};

type ProductWithStoreConfigs = Product & {
  _id?: string;
  description?: string;
  tags?: string[];
  badge?: string;
  storeConfigs?: ProductStoreConfigState[];
  relatedUpsells?: string[];
};

type CategoryWithMongo = Category & {
  _id?: string;
  id?: string;
  slug?: string;
  storeId?: string;
  storeIds?: string[];
  storeConfigs?: Array<{
    storeId?: string;
    available?: boolean;
    status?: string;
    sortOrder?: number;
  }>;
};

type ModifierGroupWithMongo = ModifierGroup & {
  _id?: string;
};

type UpsellRuleWithCategories = UpsellRule & {
  _id?: string;
  name?: string;
  appliesToCategories?: string[];
};

type ProductStoreConfigState = {
  _id?: string;
  id?: string;
  productId?: string;
  storeId: string;
  storeName?: string;
  isAvailable: boolean;
  category: string;
  categoryId: string;
  categoryName: string;
  price: number;
  sizes: ProductSize[];
  modifierGroups: ProductModifierGroup[];
  modifierGroupIds?: string[];
  relatedUpsells?: string[];
  upsell?: string;
  status: ProductStatus | "Inactive";
  sortOrder: number;
};

type ProductFormState = ProductWithStoreConfigs & {
  name: string;
  description?: string;
  image?: string;
  storeConfigs: ProductStoreConfigState[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

const SIZE_BASED_CATEGORY_KEYWORDS = [
  "pizza",
  "specialty pizza",
  "stromboli",
  "calzone",
  "hot sub",
  "cold sub",
  "seafood sub",
  "chicken",
  "wing",
];

function isSizeBasedProductCategory(value: unknown) {
  const name = String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .trim();

  return SIZE_BASED_CATEGORY_KEYWORDS.some((keyword) =>
    name.includes(keyword)
  );
}

function createRegularProductSize(price: unknown): ProductSize[] {
  return [
    {
      id: "regular",
      name: "Regular",
      price: cleanNumber(price),
      sortOrder: 0,
    },
  ];
}

function normalizeProductSizes(
  value: unknown,
  fallbackPrice: unknown
): ProductSize[] {
  const rawSizes = Array.isArray(value) ? value : [];

  const sizes = rawSizes
    .map((size: any, index) => {
      const name = String(size?.name ?? "").trim();

      if (!name) return null;

      return {
        id: String(size?.id || slugify(name) || `size-${index + 1}`),
        name,
        price: cleanNumber(size?.price),
        sortOrder: Number(size?.sortOrder ?? index),
      };
    })
    .filter(Boolean) as ProductSize[];

  if (sizes.length > 0) return sizes;

  return createRegularProductSize(fallbackPrice);
}

function getFirstSizePrice(value: unknown, fallbackPrice: unknown) {
  const sizes = normalizeProductSizes(value, fallbackPrice);
  return cleanNumber(sizes[0]?.price ?? fallbackPrice);
}

function getProductSizeNames(sizes: ProductSize[]) {
  return sizes
    .map((size) => String(size.name || "").trim())
    .filter(Boolean);
}

function normalizePricesBySize(
  value: unknown,
  sizes: ProductSize[],
  oldSizeName?: string,
  newSizeName?: string
) {
  const prices: Record<string, number> = {};

  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, price]) => {
      const cleanKey = String(key || "").trim();

      if (!cleanKey) return;

      prices[cleanKey] = cleanNumber(price);
    });
  }

  const sizeNames = getProductSizeNames(sizes);

  sizeNames.forEach((sizeName) => {
    if (sizeName in prices) return;

    if (
      oldSizeName &&
      newSizeName &&
      sizeName === newSizeName.trim() &&
      oldSizeName.trim() in prices
    ) {
      prices[sizeName] = cleanNumber(prices[oldSizeName.trim()]);
      return;
    }

    prices[sizeName] = 0;
  });

  Object.keys(prices).forEach((key) => {
    if (!sizeNames.includes(key)) {
      delete prices[key];
    }
  });

  return prices;
}

function getStoreId(store: StoreItem | null | undefined) {
  if (!store) return "";
  return String(store.slug || store._id || store.id || "").trim();
}

function getStoreName(stores: StoreItem[], storeId: string) {
  const found = stores.find((store) => getStoreId(store) === storeId);
  return found?.name || storeId;
}

function getCategoryId(category?: CategoryWithMongo | null) {
  if (!category) return "";
  return String(category._id || category.id || category.slug || "").trim();
}

function categoryMatchesStore(category: CategoryWithMongo, storeId: string) {
  const cleanStoreId = String(storeId || "").trim();
  const storeConfigs = Array.isArray(category.storeConfigs)
    ? category.storeConfigs
    : [];

  if (storeConfigs.length > 0) {
    return storeConfigs.some((config) => {
      const configStoreId = String(config.storeId || "").trim();
      const available = config.available !== false;
      const active = config.status !== "Inactive" && config.status !== "Hidden";

      return configStoreId === cleanStoreId && available && active;
    });
  }

  const legacyStoreId = String(category.storeId || "").trim();

  if (legacyStoreId) {
    return legacyStoreId === cleanStoreId;
  }

  if (Array.isArray(category.storeIds) && category.storeIds.length > 0) {
    return category.storeIds
      .map((item) => String(item || "").trim())
      .includes(cleanStoreId);
  }

  return true;
}

function findSelectedCategory(
  categories: CategoryWithMongo[],
  value: unknown,
  categoryId?: unknown,
  categoryName?: unknown
) {
  const selectedValues = [value, categoryId, categoryName]
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean);

  return categories.find((category) => {
    const categoryValues = [
      category._id,
      category.id,
      category.slug,
      category.name,
    ]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean);

    return selectedValues.some((item) => categoryValues.includes(item));
  });
}

function getCategoriesForStore(
  categories: CategoryWithMongo[],
  storeId: string
) {
  const uniqueByName = new Map<string, CategoryWithMongo>();

  categories.forEach((category) => {
    if (!categoryMatchesStore(category, storeId)) return;

    const cleanName = String(category.name || "").trim();
    if (!cleanName) return;

    const key = cleanName.toLowerCase();

    // Old DB may still have Towson/York/Liberty duplicate categories with same name.
    // Keep only one option per category name so React option keys do not duplicate.
    if (!uniqueByName.has(key)) {
      uniqueByName.set(key, category);
    }
  });

  return Array.from(uniqueByName.values()).sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );
}

function getGlobalModifierGroupId(
  group: ModifierGroupWithMongo,
  fallback: string
) {
  return String(
    group._id || group.id || group.slug || group.name || fallback
  ).trim();
}

function getProductModifierGroupId(group: unknown) {
  if (!group || typeof group !== "object") return "";

  const obj = group as {
    modifierGroupId?: unknown;
    groupId?: unknown;
    _id?: unknown;
    id?: unknown;
    slug?: unknown;
  };

  return String(
    obj.modifierGroupId || obj.groupId || obj._id || obj.id || obj.slug || ""
  ).trim();
}

function getProductModifierGroupName(group: unknown) {
  if (typeof group === "string") return group.trim();
  if (!group || typeof group !== "object") return "";

  const obj = group as {
    name?: unknown;
    title?: unknown;
    label?: unknown;
    slug?: unknown;
  };

  return String(obj.name || obj.title || obj.label || obj.slug || "").trim();
}

function getModifierGroupKeys(group: unknown) {
  return [
    getProductModifierGroupId(group),
    getProductModifierGroupName(group),
  ]
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function findMatchingProductOption(
  existingOptions: unknown[],
  option: ModifierOption,
  fallback: string
) {
  const optionId = String(option.id || fallback).trim().toLowerCase();
  const optionName = String(option.name || "").trim().toLowerCase();

  return existingOptions.find((item) => {
    if (typeof item === "string") {
      return item.trim().toLowerCase() === optionName;
    }

    if (!item || typeof item !== "object") return false;

    const obj = item as {
      optionId?: unknown;
      id?: unknown;
      _id?: unknown;
      name?: unknown;
      label?: unknown;
      title?: unknown;
    };

    const values = [
      obj.optionId,
      obj.id,
      obj._id,
      obj.name,
      obj.label,
      obj.title,
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);

    return values.includes(optionId) || values.includes(optionName);
  });
}

function getExistingOptionPrices(option: unknown) {
  if (!option || typeof option !== "object") return {};
  return (option as { pricesBySize?: unknown }).pricesBySize || {};
}

function createProductModifierGroupFromAssigned(
  assignedGroup: ModifierGroupWithMongo,
  sizes: ProductSize[],
  groupIndex: number,
  existingGroup?: unknown
): ProductModifierGroup {
  const groupId = getGlobalModifierGroupId(
    assignedGroup,
    `modifier-${groupIndex}`
  );

  const existingOptions =
    existingGroup && typeof existingGroup === "object"
      ? Array.isArray((existingGroup as any).options)
        ? (existingGroup as any).options
        : []
      : [];

  const options = Array.isArray(assignedGroup.options)
    ? assignedGroup.options
        .map((option, optionIndex) => {
          const optionName = String(option.name || "").trim();

          if (!optionName) return null;

          const fallbackOptionId =
            slugify(optionName) || `option-${optionIndex + 1}`;

          const existingOption = findMatchingProductOption(
            existingOptions,
            option,
            fallbackOptionId
          );

          return {
            id: String(option.id || fallbackOptionId),
            optionId: String(option.id || fallbackOptionId),
            name: optionName,
            status: option.status === "Inactive" ? "Inactive" : "Active",
            pricesBySize: normalizePricesBySize(
              getExistingOptionPrices(existingOption),
              sizes
            ),
          };
        })
        .filter(Boolean)
    : [];

  return {
    modifierGroupId: groupId,
    name: assignedGroup.name,
    required: Boolean(assignedGroup.required),
    minSelect: Number(assignedGroup.minSelect || 0),
    maxSelect: Number(assignedGroup.maxSelect || 0),
    sortOrder: Number(assignedGroup.sortOrder ?? groupIndex),
    status: assignedGroup.status === "Inactive" ? "Inactive" : "Active",
    options: options as ProductModifierOption[],
  };
}

function normalizeLegacyProductModifierGroup(
  group: unknown,
  sizes: ProductSize[],
  index: number
): ProductModifierGroup | null {
  if (typeof group === "string") {
    const name = group.trim();
    if (!name) return null;

    return {
      modifierGroupId: "",
      name,
      required: false,
      minSelect: 0,
      maxSelect: 0,
      sortOrder: index,
      status: "Active",
      options: [],
    };
  }

  if (!group || typeof group !== "object") return null;

  const obj = group as ProductModifierGroup & {
    _id?: string;
    id?: string;
    groupId?: string;
  };

  const name = String(obj.name || "").trim();
  const modifierGroupId = String(
    obj.modifierGroupId || obj.groupId || obj._id || obj.id || ""
  ).trim();

  if (!name && !modifierGroupId) return null;

  const options = Array.isArray(obj.options)
    ? obj.options
        .map((option: any, optionIndex) => {
          if (typeof option === "string") {
            const optionName = option.trim();
            if (!optionName) return null;

            return {
              id: slugify(optionName) || `option-${optionIndex + 1}`,
              optionId: slugify(optionName) || `option-${optionIndex + 1}`,
              name: optionName,
              status: "Active",
              pricesBySize: normalizePricesBySize({}, sizes),
            };
          }

          if (!option || typeof option !== "object") return null;

          const optionName = String(option.name || "").trim();
          if (!optionName) return null;

          const optionId = String(
            option.optionId || option.id || slugify(optionName) || ""
          ).trim();

          return {
            id: String(option.id || optionId || `option-${optionIndex + 1}`),
            optionId,
            name: optionName,
            status: option.status === "Inactive" ? "Inactive" : "Active",
            pricesBySize: normalizePricesBySize(option.pricesBySize, sizes),
          };
        })
        .filter(Boolean)
    : [];

  return {
    modifierGroupId,
    name: name || modifierGroupId,
    required: Boolean(obj.required),
    minSelect: Number(obj.minSelect || 0),
    maxSelect: Number(obj.maxSelect || 0),
    sortOrder: Number(obj.sortOrder ?? index),
    status: obj.status === "Inactive" ? "Inactive" : "Active",
    options: options as ProductModifierOption[],
  };
}

function normalizeProductModifierGroups(
  value: unknown,
  sizes: ProductSize[],
  assignedGroups: ModifierGroupWithMongo[],
  defaultToAssignedGroups: boolean
) {
  const rawGroups = Array.isArray(value) ? value : [];

  const normalizedRawGroups = rawGroups
    .map((group, index) =>
      normalizeLegacyProductModifierGroup(group, sizes, index)
    )
    .filter(Boolean) as ProductModifierGroup[];

  if (normalizedRawGroups.length === 0 && defaultToAssignedGroups) {
    return assignedGroups.map((group, index) =>
      createProductModifierGroupFromAssigned(group, sizes, index)
    );
  }

  if (assignedGroups.length === 0) {
    return normalizedRawGroups;
  }

  return normalizedRawGroups.map((existingGroup, index) => {
    const matchedAssignedGroup = assignedGroups.find((assignedGroup) => {
      const fallback = `modifier-${index}`;
      const assignedId = getGlobalModifierGroupId(assignedGroup, fallback).toLowerCase();
      const assignedName = String(assignedGroup.name || "").trim().toLowerCase();
      const existingKeys = getModifierGroupKeys(existingGroup);

      return existingKeys.includes(assignedId) || existingKeys.includes(assignedName);
    });

    if (!matchedAssignedGroup) {
      return {
        ...existingGroup,
        options: existingGroup.options.map((option) => ({
          ...option,
          pricesBySize: normalizePricesBySize(option.pricesBySize, sizes),
        })),
      };
    }

    return createProductModifierGroupFromAssigned(
      matchedAssignedGroup,
      sizes,
      index,
      existingGroup
    );
  });
}

function getAssignmentStoreId(assignment: unknown) {
  if (!assignment || typeof assignment !== "object") return "";

  const obj = assignment as {
    storeId?: unknown;
    storeSlug?: unknown;
    store?: unknown;
  };

  return String(obj.storeId || obj.storeSlug || obj.store || "").trim();
}

function assignmentMatchesCategory(
  assignment: unknown,
  categoryId: string,
  categoryName: string
) {
  if (!assignment || typeof assignment !== "object") return false;

  const obj = assignment as {
    categoryId?: unknown;
    category?: unknown;
    categoryName?: unknown;
    appliesTo?: unknown;
  };

  const assignmentValues = [
    obj.categoryId,
    obj.category,
    obj.categoryName,
    obj.appliesTo,
  ]
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean);

  const categoryValues = [categoryId, categoryName]
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean);

  return categoryValues.some((value) => assignmentValues.includes(value));
}

function getAssignedModifierGroups(
  modifierGroups: ModifierGroupWithMongo[],
  selectedStoreId: string,
  categoryId: string,
  categoryName: string
) {
  const cleanStoreId = String(selectedStoreId || "").trim();

  if (!cleanStoreId || (!categoryId && !categoryName)) return [];

  return modifierGroups
    .filter((group) => {
      if (group.status === "Inactive") return false;

      const assignments = Array.isArray(group.assignments)
        ? group.assignments
        : [];

      if (assignments.length > 0) {
        return assignments.some((assignment) => {
          if (assignment.status === "Inactive") return false;

          const storeId = getAssignmentStoreId(assignment);

          const storeMatch =
            storeId === cleanStoreId ||
            storeId.toLowerCase() === cleanStoreId.toLowerCase();

          return (
            storeMatch &&
            assignmentMatchesCategory(assignment, categoryId, categoryName)
          );
        });
      }

      const legacyStoreId = String((group as any).storeId || "").trim();

      const storeMatch =
        !legacyStoreId ||
        legacyStoreId === cleanStoreId ||
        legacyStoreId.toLowerCase() === cleanStoreId.toLowerCase();

      const legacyCategoryValues = [
        (group as any).categoryId,
        (group as any).category,
        (group as any).categoryName,
        (group as any).appliesTo,
        ...(Array.isArray((group as any).appliesToCategories)
          ? (group as any).appliesToCategories
          : []),
      ]
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean);

      const selectedCategoryValues = [categoryId, categoryName]
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean);

      const categoryMatch =
        legacyCategoryValues.length === 0 ||
        selectedCategoryValues.some((value) =>
          legacyCategoryValues.includes(value)
        );

      return storeMatch && categoryMatch;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function syncModifierGroupsWithSizes(
  groups: ProductModifierGroup[],
  sizes: ProductSize[],
  oldSizeName?: string,
  newSizeName?: string
) {
  return groups.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      pricesBySize: normalizePricesBySize(
        option.pricesBySize,
        sizes,
        oldSizeName,
        newSizeName
      ),
    })),
  }));
}

function getGroupSelected(
  selectedGroups: ProductModifierGroup[],
  assignedGroup: ModifierGroupWithMongo,
  fallback: string
) {
  const groupId = getGlobalModifierGroupId(assignedGroup, fallback).toLowerCase();
  const groupName = String(assignedGroup.name || "").trim().toLowerCase();

  return selectedGroups.some((group) => {
    const keys = getModifierGroupKeys(group);
    return keys.includes(groupId) || keys.includes(groupName);
  });
}

function getSelectedProductGroup(
  selectedGroups: ProductModifierGroup[],
  assignedGroup: ModifierGroupWithMongo,
  fallback: string
) {
  const groupId = getGlobalModifierGroupId(assignedGroup, fallback).toLowerCase();
  const groupName = String(assignedGroup.name || "").trim().toLowerCase();

  return selectedGroups.find((group) => {
    const keys = getModifierGroupKeys(group);
    return keys.includes(groupId) || keys.includes(groupName);
  });
}

function cleanProductSizesForSubmit(sizes: ProductSize[], fallbackPrice: number) {
  return normalizeProductSizes(sizes, fallbackPrice).map((size, index) => ({
    ...size,
    id: String(size.id || slugify(size.name) || `size-${index + 1}`),
    name: String(size.name || "").trim(),
    price: cleanNumber(size.price),
    sortOrder: Number(size.sortOrder ?? index),
  }));
}

function cleanProductModifierGroupsForSubmit(
  groups: ProductModifierGroup[],
  sizes: ProductSize[]
) {
  return groups
    .map((group, groupIndex) => {
      const name = String(group.name || "").trim();

      if (!name) return null;

      return {
        modifierGroupId: String(group.modifierGroupId || "").trim(),
        name,
        required: Boolean(group.required),
        minSelect: Number(group.minSelect || 0),
        maxSelect: Number(group.maxSelect || 0),
        sortOrder: Number(group.sortOrder ?? groupIndex),
        status: group.status === "Inactive" ? "Inactive" : "Active",
        options: Array.isArray(group.options)
          ? group.options
              .map((option, optionIndex) => {
                const optionName = String(option.name || "").trim();

                if (!optionName) return null;

                return {
                  id:
                    String(option.id || "").trim() ||
                    slugify(optionName) ||
                    `option-${optionIndex + 1}`,
                  optionId:
                    String(option.optionId || option.id || "").trim() ||
                    slugify(optionName) ||
                    `option-${optionIndex + 1}`,
                  name: optionName,
                  status: option.status === "Inactive" ? "Inactive" : "Active",
                  pricesBySize: normalizePricesBySize(
                    option.pricesBySize,
                    sizes
                  ),
                };
              })
              .filter(Boolean)
          : [],
      };
    })
    .filter(Boolean);
}

function getConfigId(config: unknown) {
  if (!config || typeof config !== "object") return "";
  const obj = config as { _id?: unknown; id?: unknown };
  return String(obj._id || obj.id || "").trim();
}

function findConfigForStore(configs: ProductStoreConfigState[], storeId: string) {
  return configs.find(
    (config) => String(config.storeId || "").trim() === String(storeId || "").trim()
  );
}


function getProductRecordId(product: unknown) {
  if (!product || typeof product !== "object") return "";

  const obj = product as { _id?: unknown; id?: unknown; productId?: unknown };
  return String(obj._id || obj.id || obj.productId || "").trim();
}

function productNameKey(value: unknown) {
  return slugify(String(value || "").trim());
}

async function productNameAlreadyExists(name: string, currentProductId?: string) {
  const cleanName = String(name || "").trim();
  if (!cleanName || typeof window === "undefined") return false;

  try {
    const response = await fetch(
      `/api/admin/menu/products?search=${encodeURIComponent(cleanName)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return false;

    const json = await response.json();
    const products = Array.isArray(json?.data) ? json.data : [];
    const currentId = String(currentProductId || "").trim();
    const targetNameKey = productNameKey(cleanName);

    return products.some((product: any) => {
      const productId = getProductRecordId(product);
      const sameRecord = currentId && productId === currentId;
      if (sameRecord) return false;

      const productKey = productNameKey(product?.name || product?.slug);
      return productKey === targetNameKey;
    });
  } catch (error) {
    // Backend duplicate protection will still catch this.
    return false;
  }
}

function normalizeStoreConfig(params: {
  rawConfig?: any;
  storeId: string;
  storeName?: string;
  categories: CategoryWithMongo[];
  modifierGroups: ModifierGroupWithMongo[];
  selectedStoreId: string;
  legacyProduct?: any;
  isNewProduct: boolean;
}): ProductStoreConfigState {
  const raw = params.rawConfig || {};
  const legacy = params.legacyProduct || {};
  const useLegacy = !params.rawConfig && legacy.storeId === params.storeId;

  const categorySource = useLegacy ? legacy : raw;
  const storeCategories = getCategoriesForStore(params.categories, params.storeId);
  const matchedCategory = findSelectedCategory(
    storeCategories,
    categorySource.category,
    categorySource.categoryId,
    categorySource.categoryName
  );

  const categoryId = getCategoryId(matchedCategory) || String(categorySource.categoryId || "").trim();
  const categoryName = matchedCategory?.name || String(categorySource.categoryName || categorySource.category || "").trim();

  const price = cleanNumber(useLegacy ? legacy.price : raw.price);
  const sizes = normalizeProductSizes(useLegacy ? legacy.sizes : raw.sizes, price);

  const assignedGroups = getAssignedModifierGroups(
    params.modifierGroups,
    params.storeId,
    categoryId,
    categoryName
  );

  const isAvailable = params.rawConfig
    ? raw.isAvailable !== false
    : params.isNewProduct
    ? params.storeId === params.selectedStoreId
    : useLegacy;

  return {
    _id: raw._id,
    id: raw.id,
    productId: raw.productId,
    storeId: params.storeId,
    storeName: params.storeName,
    isAvailable,
    category: categoryId || categoryName,
    categoryId,
    categoryName,
    price: Number(sizes[0]?.price || price || 0),
    sizes,
    modifierGroups: normalizeProductModifierGroups(
      useLegacy ? legacy.modifierGroups : raw.modifierGroups,
      sizes,
      assignedGroups,
      false
    ),
    modifierGroupIds: normalizeStringArray(useLegacy ? legacy.modifierGroupIds : raw.modifierGroupIds),
    relatedUpsells: normalizeStringArray(useLegacy ? legacy.relatedUpsells : raw.relatedUpsells),
    upsell: String(useLegacy ? legacy.upsell || "" : raw.upsell || ""),
    status: (raw.status || legacy.status || "Active") as ProductStatus,
    sortOrder: Number(raw.sortOrder ?? legacy.sortOrder ?? 0),
  };
}

function buildStoreConfigs(params: {
  item: ProductWithStoreConfigs | null;
  stores: StoreItem[];
  categories: CategoryWithMongo[];
  modifierGroups: ModifierGroupWithMongo[];
  selectedStoreId: string;
}) {
  const rawConfigs = Array.isArray(params.item?.storeConfigs)
    ? params.item?.storeConfigs || []
    : [];

  const baseStores = params.stores.length
    ? params.stores
    : [
        {
          id: params.selectedStoreId || params.item?.storeId || "towson",
          slug: params.selectedStoreId || params.item?.storeId || "towson",
          name: params.selectedStoreId || params.item?.storeId || "Towson",
        },
      ];

  return baseStores.map((store) => {
    const storeId = getStoreId(store);
    const rawConfig = rawConfigs.find(
      (config) => String(config.storeId || "").trim() === storeId
    );

    return normalizeStoreConfig({
      rawConfig,
      storeId,
      storeName: store.name,
      categories: params.categories,
      modifierGroups: params.modifierGroups,
      selectedStoreId: params.selectedStoreId || getStoreId(baseStores[0]),
      legacyProduct: params.item,
      isNewProduct: !params.item,
    });
  });
}

type ProductFormProps = {
  item: Product | null;
  categories: Category[];
  modifierGroups: ModifierGroup[];
  upsellRules?: UpsellRule[];
  selectedStoreId?: string;
  stores?: StoreItem[];
  onSave: (value: any) => void;
};

const ProductForm = forwardRef<ProductFormRef, ProductFormProps>(
  function ProductForm(
    {
      item,
      categories,
      modifierGroups,
      upsellRules = [],
      selectedStoreId = "",
      stores = [],
      onSave,
    },
    ref
  ) {
    const safeCategories = Array.isArray(categories)
      ? (categories as CategoryWithMongo[])
      : [];

    const safeModifierGroups = Array.isArray(modifierGroups)
      ? (modifierGroups as ModifierGroupWithMongo[])
      : [];

    const safeUpsellRules = Array.isArray(upsellRules)
      ? (upsellRules as UpsellRuleWithCategories[])
      : [];

    const safeStores = Array.isArray(stores) ? stores : [];

    const [form, setForm] = useState<ProductFormState>(() => {
      const product = item as ProductWithStoreConfigs | null;
      const storeConfigs = buildStoreConfigs({
        item: product,
        stores: safeStores,
        categories: safeCategories,
        modifierGroups: safeModifierGroups,
        selectedStoreId,
      });

      const firstActiveConfig = storeConfigs.find((config) => config.isAvailable) || storeConfigs[0];

      return {
        ...(product || ({} as ProductWithStoreConfigs)),
        id: product?.id || "",
        _id: product?._id,
        storeId: firstActiveConfig?.storeId || selectedStoreId,
        name: product?.name || "",
        description: product?.description || "",
        image: product?.image || "",
        tags: Array.isArray(product?.tags) ? product?.tags : [],
        badge: product?.badge || "",
        category: firstActiveConfig?.category || "",
        categoryId: firstActiveConfig?.categoryId || "",
        categoryName: firstActiveConfig?.categoryName || "",
        price: firstActiveConfig?.price || 0,
        sizes: firstActiveConfig?.sizes || createRegularProductSize(0),
        modifierGroups: firstActiveConfig?.modifierGroups || [],
        modifierGroupIds: firstActiveConfig?.modifierGroupIds || [],
        relatedUpsells: firstActiveConfig?.relatedUpsells || [],
        upsell: firstActiveConfig?.upsell || "",
        status: (firstActiveConfig?.status || "Active") as ProductStatus,
        updatedAt: product?.updatedAt || "Today",
        storeConfigs,
      };
    });

    const activeStoreConfigs = useMemo(
      () => form.storeConfigs.filter((config) => config.isAvailable),
      [form.storeConfigs]
    );

    const [activeStoreId, setActiveStoreId] = useState(() => {
      const firstAvailable = form.storeConfigs.find((config) => config.isAvailable);
      return firstAvailable?.storeId || form.storeConfigs[0]?.storeId || selectedStoreId || "";
    });

    const [expandedModifierKey, setExpandedModifierKey] = useState("");

    const activeStoreConfig = useMemo(() => {
      return (
        findConfigForStore(form.storeConfigs, activeStoreId) ||
        form.storeConfigs.find((config) => config.isAvailable) ||
        form.storeConfigs[0] ||
        null
      );
    }, [activeStoreId, form.storeConfigs]);

    const toggleStoreAvailability = (storeId: string) => {
      setForm((prev) => ({
        ...prev,
        storeConfigs: prev.storeConfigs.map((config) =>
          config.storeId === storeId
            ? { ...config, isAvailable: !config.isAvailable }
            : config
        ),
      }));
    };

    const updateStoreConfig = (
      storeId: string,
      updater: (config: ProductStoreConfigState) => ProductStoreConfigState
    ) => {
      setForm((prev) => ({
        ...prev,
        storeConfigs: prev.storeConfigs.map((config) =>
          config.storeId === storeId ? updater(config) : config
        ),
      }));
    };

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        event.target.value = "";
        return;
      }

      const maxSize = 1.5 * 1024 * 1024;

      if (file.size > maxSize) {
        alert("Image is too large. Please upload an image under 1.5MB.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== "string") return;

        setForm((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };

      reader.readAsDataURL(file);
      event.target.value = "";
    };

    const handleCategoryChange = (storeId: string, value: string) => {
      const storeCategories = getCategoriesForStore(safeCategories, storeId);
      const selectedCategory = findSelectedCategory(storeCategories, value);
      const selectedCategoryId = getCategoryId(selectedCategory);
      const selectedCategoryName = selectedCategory?.name || value;
      const nextCategoryUsesSizes = isSizeBasedProductCategory(selectedCategoryName);

      updateStoreConfig(storeId, (config) => {
        const currentSizes = normalizeProductSizes(config.sizes, config.price);
        const nextBasePrice = getFirstSizePrice(currentSizes, config.price);
        const nextSizes = nextCategoryUsesSizes
          ? currentSizes
          : createRegularProductSize(nextBasePrice);

        const nextAssignedGroups = getAssignedModifierGroups(
          safeModifierGroups,
          storeId,
          selectedCategoryId,
          selectedCategoryName
        );

        return {
          ...config,
          category: selectedCategoryId || selectedCategoryName,
          categoryId: selectedCategoryId,
          categoryName: selectedCategoryName,
          price: Number(nextSizes[0]?.price || 0),
          sizes: nextSizes,
          relatedUpsells: [],
          modifierGroups: normalizeProductModifierGroups(
            [],
            nextSizes,
            nextAssignedGroups,
            false
          ),
          modifierGroupIds: [],
        };
      });
    };

    const updateSize = (
      storeId: string,
      index: number,
      field: "name" | "price",
      value: string
    ) => {
      updateStoreConfig(storeId, (config) => {
        const currentSizes = normalizeProductSizes(config.sizes, config.price);
        const oldSizeName = currentSizes[index]?.name || "";

        const nextSizes = currentSizes.map((size, sizeIndex) => {
          if (sizeIndex !== index) return size;

          if (field === "name") {
            return {
              ...size,
              name: value,
            };
          }

          return {
            ...size,
            price: cleanNumber(value),
          };
        });

        const cleanSizes = normalizeProductSizes(nextSizes, config.price);

        const nextPrice =
          index === 0 && field === "price"
            ? cleanNumber(value)
            : Number(cleanSizes[0]?.price || config.price || 0);

        return {
          ...config,
          price: nextPrice,
          sizes: cleanSizes,
          modifierGroups: syncModifierGroupsWithSizes(
            config.modifierGroups,
            cleanSizes,
            oldSizeName,
            field === "name" ? value : oldSizeName
          ),
        };
      });
    };

    const addSize = (storeId: string) => {
      updateStoreConfig(storeId, (config) => {
        const currentSizes = normalizeProductSizes(config.sizes, config.price);
        const nextIndex = currentSizes.length + 1;
        const newSizeName = `Size ${nextIndex}`;
        const nextSizes = [
          ...currentSizes,
          {
            id: `size-${Date.now()}-${nextIndex}`,
            name: newSizeName,
            price: 0,
            sortOrder: currentSizes.length,
          },
        ];

        return {
          ...config,
          sizes: nextSizes,
          modifierGroups: syncModifierGroupsWithSizes(
            config.modifierGroups,
            nextSizes
          ),
        };
      });
    };

    const removeSize = (storeId: string, index: number) => {
      updateStoreConfig(storeId, (config) => {
        const currentSizes = normalizeProductSizes(config.sizes, config.price);

        if (currentSizes.length <= 1) {
          alert("At least one size is required.");
          return config;
        }

        const nextSizes = currentSizes.filter((_, sizeIndex) => sizeIndex !== index);

        return {
          ...config,
          price: Number(nextSizes[0]?.price || 0),
          sizes: nextSizes,
          modifierGroups: syncModifierGroupsWithSizes(
            config.modifierGroups,
            nextSizes
          ),
        };
      });
    };

    const toggleModifier = (
      storeId: string,
      group: ModifierGroupWithMongo,
      index: number,
      sizes: ProductSize[]
    ) => {
      updateStoreConfig(storeId, (config) => {
        const selected = getGroupSelected(
          config.modifierGroups,
          group,
          `modifier-${index}`
        );

        if (selected) {
          const groupId = getGlobalModifierGroupId(group, `modifier-${index}`).toLowerCase();
          const groupName = String(group.name || "").trim().toLowerCase();

          return {
            ...config,
            modifierGroups: config.modifierGroups.filter((item) => {
              const keys = getModifierGroupKeys(item);
              return !keys.includes(groupId) && !keys.includes(groupName);
            }),
          };
        }

        const nextGroup = createProductModifierGroupFromAssigned(
          group,
          sizes,
          index
        );

        return {
          ...config,
          modifierGroups: [...config.modifierGroups, nextGroup],
        };
      });
    };

    const updateModifierOptionPrice = (
      storeId: string,
      groupIndex: number,
      optionIndex: number,
      sizeName: string,
      value: string
    ) => {
      updateStoreConfig(storeId, (config) => {
        const nextGroups = config.modifierGroups.map((group, currentGroupIndex) => {
          if (currentGroupIndex !== groupIndex) return group;

          return {
            ...group,
            options: group.options.map((option, currentOptionIndex) => {
              if (currentOptionIndex !== optionIndex) return option;

              return {
                ...option,
                pricesBySize: {
                  ...option.pricesBySize,
                  [sizeName.trim()]: cleanNumber(value),
                },
              };
            }),
          };
        });

        return {
          ...config,
          modifierGroups: nextGroups,
        };
      });
    };

    const toggleUpsell = (storeId: string, id: string) => {
      updateStoreConfig(storeId, (config) => {
        const current = config.relatedUpsells || [];
        const exists = current.includes(id);

        return {
          ...config,
          relatedUpsells: exists
            ? current.filter((item) => item !== id)
            : [...current, id],
        };
      });
    };

    const submit = async () => {
      const cleanProductName = form.name.trim();

      if (!cleanProductName) return alert("Product name required");

      const currentProductId = String(form._id || form.id || "").trim();
      const duplicateProductExists = await productNameAlreadyExists(
        cleanProductName,
        currentProductId
      );

      if (duplicateProductExists) {
        return alert(
          "This product already exists. Please edit the existing product instead of adding it again."
        );
      }

      if (activeStoreConfigs.length === 0) {
        return alert("Select at least one store for this product.");
      }

      try {
        const cleanStoreConfigs = form.storeConfigs.map((config) => {
        if (!config.isAvailable) {
          return {
            ...config,
            isAvailable: false,
          };
        }

        const selectedCategory = findSelectedCategory(
          safeCategories,
          config.category,
          config.categoryId,
          config.categoryName
        );

        const selectedCategoryId =
          getCategoryId(selectedCategory) || String(config.categoryId || "").trim();

        const selectedCategoryName =
          selectedCategory?.name || String(config.categoryName || config.category || "").trim();

        if (!selectedCategoryName) {
          throw new Error(`Category required for ${config.storeName || config.storeId}`);
        }

        const submitCategoryUsesSizes = isSizeBasedProductCategory(selectedCategoryName);

        const cleanSizes = submitCategoryUsesSizes
          ? cleanProductSizesForSubmit(config.sizes, config.price)
          : createRegularProductSize(getFirstSizePrice(config.sizes, config.price));

        const sizeNames = getProductSizeNames(cleanSizes);
        const uniqueSizeNames = new Set(sizeNames.map((size) => size.toLowerCase()));

        if (sizeNames.length !== uniqueSizeNames.size) {
          throw new Error(`Size names must be unique for ${config.storeName || config.storeId}.`);
        }

        const selectedUpsellNames = safeUpsellRules
          .filter((rule, index) => {
            const ruleId = getSafeId(rule, `upsell-${index}`);
            return config.relatedUpsells?.includes(ruleId);
          })
          .map((rule) => rule.offer)
          .filter(Boolean);

        const cleanModifierGroups = cleanProductModifierGroupsForSubmit(
          config.modifierGroups,
          cleanSizes
        ) as ProductModifierGroup[];

        const modifierGroupIds = cleanModifierGroups
          .map((group) => String(group.modifierGroupId || "").trim())
          .filter(Boolean);

        return {
          ...config,
          isAvailable: true,
          category: selectedCategoryId || selectedCategoryName,
          categoryId: selectedCategoryId,
          categoryName: selectedCategoryName,
          price: Number(cleanSizes[0]?.price || config.price || 0),
          sizes: cleanSizes,
          modifierGroups: cleanModifierGroups,
          modifierGroupIds,
          upsell: selectedUpsellNames.join(", "),
          relatedUpsells: config.relatedUpsells || [],
          status: config.status || "Active",
          sortOrder: Number(config.sortOrder || 0),
        };
      });

      const firstActiveConfig = cleanStoreConfigs.find((config) => config.isAvailable);

        onSave({
          ...form,
          name: cleanProductName,
          description: String(form.description || ""),
          image: form.image || "",
          storeId: firstActiveConfig?.storeId || "",
          category: firstActiveConfig?.category || "",
          categoryId: firstActiveConfig?.categoryId || "",
          categoryName: firstActiveConfig?.categoryName || "",
          price: firstActiveConfig?.price || 0,
          sizes: firstActiveConfig?.sizes || [],
          modifierGroups: firstActiveConfig?.modifierGroups || [],
          modifierGroupIds: firstActiveConfig?.modifierGroupIds || [],
          relatedUpsells: firstActiveConfig?.relatedUpsells || [],
          upsell: firstActiveConfig?.upsell || "",
          status: firstActiveConfig?.status || "Active",
          sortOrder: firstActiveConfig?.sortOrder || 0,
          storeConfigs: cleanStoreConfigs,
          replaceStoreConfigs: true,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Product form has invalid data.");
      }
    };

    useImperativeHandle(ref, () => ({ submit }));

    return (
      <>
        <ImageUploadBox
          label="Product Image"
          image={form.image}
          alt={form.name || "Product"}
          onUpload={handleImageUpload}
          onRemove={() => setForm((prev) => ({ ...prev, image: "" }))}
        />

        <FormInput
          label="Product Name"
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="Large Cheese Pizza"
        />

        <FormInput
          label="Description"
          value={String(form.description || "")}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, description: value }))
          }
          placeholder="Short product description"
        />

        <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-4">
            <h3 className="text-base font-black text-zinc-900">
              Store Availability & Pricing
            </h3>
            <p className="mt-1 text-xs font-bold text-zinc-500">
              Product is added once. Pick a store tab below, then manage only that store's category, prices, sizes, modifiers, status, and order.
            </p>
          </div>

          {form.storeConfigs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm font-bold text-zinc-500">
              No stores found. Please add stores first.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                {form.storeConfigs.map((config) => {
                  const active = activeStoreConfig?.storeId === config.storeId;
                  const previewPrice = getFirstSizePrice(config.sizes, config.price);

                  return (
                    <button
                      type="button"
                      key={config.storeId}
                      onClick={() => setActiveStoreId(config.storeId)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-green-700 bg-white shadow-sm"
                          : "border-zinc-200 bg-white hover:border-green-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-zinc-950">
                          {config.storeName || getStoreName(safeStores, config.storeId)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${
                            config.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {config.isAvailable ? "Available" : "Off"}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs font-bold text-zinc-400">
                        {config.categoryName || "No category selected"}
                      </p>
                      <p className="mt-2 text-xs font-black text-zinc-700">
                        Base: ${previewPrice || 0}
                      </p>
                    </button>
                  );
                })}
              </div>

              {activeStoreConfig ? (
                (() => {
                  const config = activeStoreConfig;

                  const categoriesForStore = getCategoriesForStore(
                    safeCategories,
                    config.storeId
                  );

                  const categoryUsesSizes = isSizeBasedProductCategory(
                    config.categoryName || config.category
                  );

                  const productSizes = categoryUsesSizes
                    ? normalizeProductSizes(config.sizes, config.price)
                    : createRegularProductSize(getFirstSizePrice(config.sizes, config.price));

                  const assignedModifierGroups = getAssignedModifierGroups(
                    safeModifierGroups,
                    config.storeId,
                    config.categoryId,
                    config.categoryName || config.category
                  );

                  const categoryBasedUpsells = safeUpsellRules.filter((rule) => {
                    const selectedCategories = Array.isArray(rule.appliesToCategories)
                      ? rule.appliesToCategories
                      : [];

                    if (rule.status === "Paused" || rule.status === "Inactive") {
                      return false;
                    }

                    if (selectedCategories.length > 0) {
                      return (
                        selectedCategories.includes(String(config.category || "")) ||
                        selectedCategories.includes(String(config.categoryId || "")) ||
                        selectedCategories.includes(String(config.categoryName || ""))
                      );
                    }

                    const trigger = String(rule.trigger || "").toLowerCase();
                    const currentCategory = String(config.categoryName || config.category || "").toLowerCase();

                    return (
                      trigger.includes("all") ||
                      trigger.includes("any") ||
                      trigger.includes(currentCategory) ||
                      trigger.includes(currentCategory.replace(/s$/, ""))
                    );
                  });

                  return (
                    <div
                      key={config.storeId}
                      className="rounded-[22px] border border-zinc-200 bg-white p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-950">
                            {config.storeName || getStoreName(safeStores, config.storeId)} Store Config
                          </p>
                          <p className="text-xs font-bold text-zinc-400">
                            {config.storeId}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStoreAvailability(config.storeId)}
                          className={`rounded-full px-4 py-2 text-xs font-black transition ${
                            config.isAvailable
                              ? "bg-green-700 text-white"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {config.isAvailable ? "Available" : "Not Available"}
                        </button>
                      </div>

                      {config.isAvailable ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <FormSelect
                              label="Category"
                              value={String(config.categoryName || "")}
                              onChange={(value) =>
                                handleCategoryChange(config.storeId, value)
                              }
                              options={Array.from(
                                new Set(
                                  categoriesForStore
                                    .map((item) => String(item.name || "").trim())
                                    .filter(Boolean)
                                )
                              )}
                            />

                            <FormSelect
                              label="Status"
                              value={config.status}
                              onChange={(value) =>
                                updateStoreConfig(config.storeId, (prevConfig) => ({
                                  ...prevConfig,
                                  status: value as ProductStatus,
                                }))
                              }
                              options={["Active", "Draft", "Hidden", "Inactive"]}
                            />

                            <FormInput
                              label="Sort Order"
                              value={String(config.sortOrder || 0)}
                              onChange={(value) =>
                                updateStoreConfig(config.storeId, (prevConfig) => ({
                                  ...prevConfig,
                                  sortOrder: cleanNumber(value),
                                }))
                              }
                              type="number"
                              placeholder="0"
                            />
                          </div>

                          {categoryUsesSizes ? (
                            <details className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4" open>
                              <summary className="cursor-pointer list-none">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <label className="block text-sm font-black text-zinc-700">
                                      Product Sizes & Base Prices
                                    </label>
                                    <p className="mt-1 text-xs font-semibold text-zinc-500">
                                      Click this section to collapse/expand sizes.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      addSize(config.storeId);
                                    }}
                                    className="rounded-full bg-green-700 px-4 py-2 text-xs font-black text-white transition hover:bg-green-800"
                                  >
                                    Add Size
                                  </button>
                                </div>
                              </summary>

                              <div className="mt-4 space-y-3">
                                {productSizes.map((size, index) => (
                                  <div
                                    key={size.id || `size-${index}`}
                                    className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-3 md:grid-cols-[1fr_160px_auto]"
                                  >
                                    <input
                                      value={size.name}
                                      onChange={(event) =>
                                        updateSize(
                                          config.storeId,
                                          index,
                                          "name",
                                          event.target.value
                                        )
                                      }
                                      placeholder="Small"
                                      className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none transition focus:border-green-700"
                                    />

                                    <input
                                      value={String(size.price)}
                                      onChange={(event) =>
                                        updateSize(
                                          config.storeId,
                                          index,
                                          "price",
                                          event.target.value
                                        )
                                      }
                                      type="number"
                                      placeholder="0.00"
                                      className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none transition focus:border-green-700"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => removeSize(config.storeId, index)}
                                      className="h-11 rounded-xl border border-red-100 px-4 text-xs font-black text-red-600 transition hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : (
                            <FormInput
                              label="Base Price"
                              value={String(productSizes[0]?.price ?? config.price ?? 0)}
                              onChange={(value) =>
                                updateStoreConfig(config.storeId, (prevConfig) => {
                                  const nextPrice = cleanNumber(value);
                                  const nextSizes = createRegularProductSize(nextPrice);

                                  return {
                                    ...prevConfig,
                                    price: nextPrice,
                                    sizes: nextSizes,
                                    modifierGroups: syncModifierGroupsWithSizes(
                                      prevConfig.modifierGroups,
                                      nextSizes
                                    ),
                                  };
                                })
                              }
                              type="number"
                              placeholder="8.99"
                            />
                          )}

                          <details className="rounded-[22px] border border-zinc-200 bg-white p-4">
                            <summary className="cursor-pointer list-none text-sm font-black text-zinc-700">
                              Related Upsells
                            </summary>

                            <div className="mt-3">
                              {categoryBasedUpsells.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-bold text-zinc-500">
                                  No upsell rules found for this category.
                                </div>
                              ) : (
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {categoryBasedUpsells.map((rule, index) => {
                                    const ruleId = getSafeId(rule, `upsell-${index}`);
                                    const selected = config.relatedUpsells?.includes(ruleId);

                                    return (
                                      <button
                                        type="button"
                                        key={ruleId}
                                        onClick={() => toggleUpsell(config.storeId, ruleId)}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                                          selected
                                            ? "border-green-700 bg-green-50 text-green-800"
                                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                                        }`}
                                      >
                                        <span className="block">
                                          {rule.offer || rule.name || "Upsell Offer"}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </details>

                          <details className="rounded-[22px] border border-zinc-200 bg-white p-4">
                            <summary className="cursor-pointer list-none">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-black text-zinc-700">
                                  Assigned Modifier Groups
                                </span>
                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                                  {config.modifierGroups.length} selected
                                </span>
                              </div>
                            </summary>

                            <div className="mt-4">
                              {assignedModifierGroups.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-bold text-zinc-500">
                                  No modifier group is assigned to this store/category yet.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {assignedModifierGroups.map((group, index) => {
                                    const groupId = getGlobalModifierGroupId(group, `modifier-${index}`);
                                    const selected = getGroupSelected(config.modifierGroups, group, `modifier-${index}`);
                                    const selectedGroup = getSelectedProductGroup(config.modifierGroups, group, `modifier-${index}`);
                                    const selectedGroupIndex = config.modifierGroups.findIndex((item) => item === selectedGroup);
                                    const editorKey = `${config.storeId}-${groupId}`;
                                    const editorOpen = expandedModifierKey === editorKey;

                                    return (
                                      <div
                                        key={groupId}
                                        className="rounded-[18px] border border-zinc-200 bg-zinc-50 p-3"
                                      >
                                        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                                          <button
                                            type="button"
                                            onClick={() => toggleModifier(config.storeId, group, index, productSizes)}
                                            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                                              selected
                                                ? "border-green-700 bg-green-50 text-green-800"
                                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                                            }`}
                                          >
                                            <span>{group.name}</span>
                                            <span className="text-xs">
                                              {selected ? "Selected" : "Click to add"}
                                            </span>
                                          </button>

                                          {selected && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedModifierKey((current) =>
                                                  current === editorKey ? "" : editorKey
                                                )
                                              }
                                              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-700 transition hover:bg-zinc-50"
                                            >
                                              {editorOpen ? "Hide Prices" : "Edit Prices"}
                                            </button>
                                          )}
                                        </div>

                                        {selected && selectedGroup && editorOpen && (
                                          <div className="mt-4 space-y-3">
                                            <div className="grid gap-2 text-xs font-black text-zinc-500 md:grid-cols-[180px_1fr]">
                                              <span>Option</span>
                                              <span>Price by Size</span>
                                            </div>

                                            {selectedGroup.options.length === 0 ? (
                                              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-sm font-bold text-zinc-500">
                                                No options found in this modifier group.
                                              </div>
                                            ) : (
                                              selectedGroup.options.map((option, optionIndex) => {
                                                if (option.status === "Inactive") return null;

                                                return (
                                                  <div
                                                    key={`${option.optionId || option.id || option.name}-${optionIndex}`}
                                                    className="grid gap-3 rounded-2xl border border-zinc-100 bg-white p-3 md:grid-cols-[180px_1fr]"
                                                  >
                                                    <div className="flex items-center text-sm font-black text-zinc-800">
                                                      {option.name}
                                                    </div>

                                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                      {productSizes.map((size) => (
                                                        <label
                                                          key={`${config.storeId}-${option.name}-${size.id}`}
                                                          className="block"
                                                        >
                                                          <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zinc-500">
                                                            {size.name}
                                                          </span>

                                                          <input
                                                            type="number"
                                                            value={String(
                                                              option.pricesBySize?.[
                                                                String(size.name || "").trim()
                                                              ] ?? 0
                                                            )}
                                                            onChange={(event) =>
                                                              updateModifierOptionPrice(
                                                                config.storeId,
                                                                selectedGroupIndex,
                                                                optionIndex,
                                                                size.name,
                                                                event.target.value
                                                              )
                                                            }
                                                            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-green-700"
                                                          />
                                                        </label>
                                                      ))}
                                                    </div>
                                                  </div>
                                                );
                                              })
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-bold text-zinc-500">
                          This product is disabled for this store. Turn on Available if this store should sell it.
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : null}
            </div>
          )}
        </div>
      </>
    );
  }
);
ProductForm.displayName = "ProductForm";

export default ProductForm;
