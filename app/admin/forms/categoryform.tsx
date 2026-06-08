"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import type { Category, CategoryStatus } from "../menu/types";
import { FormInput, FormSelect } from "../menu/components/ui";

export type CategoryFormRef = {
  submit: () => void;
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
  }>;
};

type CategoryFormProps = {
  item: Category | null;
  categories: Category[];
  selectedStoreId?: string;
  onSave: (value: CategoryWithMongo) => void;
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeText(value: unknown) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeStoreId(value: unknown) {
  return cleanText(value).toLowerCase();
}

function getCategoryId(category: CategoryWithMongo | null | undefined) {
  if (!category) return "";
  return cleanText(category._id || category.id || category.slug || "");
}

function getCategoryStoreIds(category: CategoryWithMongo) {
  const storeIds = new Set<string>();

  if (category.storeId) {
    storeIds.add(normalizeStoreId(category.storeId));
  }

  if (Array.isArray(category.storeIds)) {
    category.storeIds.forEach((storeId) => {
      const cleanStoreId = normalizeStoreId(storeId);
      if (cleanStoreId) storeIds.add(cleanStoreId);
    });
  }

  if (Array.isArray(category.storeConfigs)) {
    category.storeConfigs.forEach((config) => {
      if (config?.available === false) return;
      if (config?.status === "Inactive" || config?.status === "Hidden") return;

      const cleanStoreId = normalizeStoreId(config?.storeId);
      if (cleanStoreId) storeIds.add(cleanStoreId);
    });
  }

  return Array.from(storeIds).filter(Boolean);
}

const CategoryForm = forwardRef<CategoryFormRef, CategoryFormProps>(
  function CategoryForm(
    { item, categories, selectedStoreId = "", onSave },
    ref
  ) {
    const safeCategories = Array.isArray(categories)
      ? (categories as CategoryWithMongo[])
      : [];

    const [form, setForm] = useState<CategoryWithMongo>(() => {
      if (item) {
        const editItem = item as CategoryWithMongo;

        return {
          ...editItem,
          storeId: editItem.storeId || selectedStoreId,
        };
      }

      return {
        id: "",
        storeId: selectedStoreId,
        name: "",
        status: "Active" as CategoryStatus,
        sortOrder: safeCategories.length + 1,
      };
    });

    const submit = () => {
      const name = cleanText(form.name);
      const storeId = normalizeStoreId(form.storeId || selectedStoreId);

      if (!name) return alert("Category name required");

      if (!storeId) {
        return alert("Store is required for category");
      }

      const currentId = getCategoryId(form);
      const duplicate = safeCategories.find((category) => {
        const sameName = normalizeText(category.name) === normalizeText(name);
        if (!sameName) return false;

        const categoryId = getCategoryId(category);
        const sameRecord = Boolean(currentId && categoryId && currentId === categoryId);
        if (sameRecord) return false;

        const categoryStoreIds = getCategoryStoreIds(category);
        return categoryStoreIds.includes(storeId);
      });

      if (duplicate) {
        return alert(`Category "${name}" already exists for this store.`);
      }

      onSave({
        ...form,
        name,
        storeId,
        sortOrder: Number(form.sortOrder || 1),
      });
    };

    useImperativeHandle(ref, () => ({ submit }));

    return (
      <>
        <FormInput
          label="Category Name"
          value={form.name}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              name: value,
            }))
          }
          placeholder="Pizzas"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Sort Order"
            value={String(form.sortOrder)}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                sortOrder: Number(value || 1),
              }))
            }
            type="number"
            placeholder="1"
          />

          <FormSelect
            label="Status"
            value={form.status}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                status: value as CategoryStatus,
              }))
            }
            options={["Active", "Inactive"]}
          />
        </div>
      </>
    );
  }
);

CategoryForm.displayName = "CategoryForm";

export default CategoryForm;
