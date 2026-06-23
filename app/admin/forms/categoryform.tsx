"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import type { Category, CategoryStatus } from "../menu/types";
import { FormInput, FormSelect } from "../menu/components/ui";
import ImageUploadBox from "../adminmenumodel/imageuploadbox";

export type CategoryFormRef = {
  submit: () => void;
};

type CategoryWithMongo = Category & {
  _id?: string;
  id?: string;
  slug?: string;
  storeId?: string;
  storeIds?: string[];
  stores?: string[];
  storeConfigs?: Array<{
    storeId?: string;
    available?: boolean;
    isAvailable?: boolean;
    status?: string;
  }>;
};

type StoreOption = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
};

type CategoryFormProps = {
  item: Category | null;
  categories: Category[];
  stores?: StoreOption[];
  selectedStoreId?: string;
  selectedStoreIds?: string[];
  onSave: (value: CategoryWithMongo) => void;
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeText(value: unknown) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeStoreId(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStoreIds(values: unknown[]) {
  return Array.from(
    new Set(values.map(normalizeStoreId).filter(Boolean))
  );
}

function getCategoryId(category: CategoryWithMongo | null | undefined) {
  if (!category) return "";
  return cleanText(category._id || category.id || category.slug || "");
}

function getCategoryStoreIds(category: CategoryWithMongo | null | undefined) {
  if (!category) return [];

  const storeIds: string[] = [];

  if (category.storeId) storeIds.push(category.storeId);

  if (Array.isArray(category.storeIds)) {
    storeIds.push(...category.storeIds);
  }

  if (Array.isArray(category.stores)) {
    storeIds.push(...category.stores);
  }

  if (Array.isArray(category.storeConfigs)) {
    category.storeConfigs.forEach((config) => {
      if (config?.available === false || config?.isAvailable === false) return;
      if (["Inactive", "Hidden"].includes(cleanText(config?.status))) return;
      if (config?.storeId) storeIds.push(config.storeId);
    });
  }

  return uniqueStoreIds(storeIds);
}

const CategoryForm = forwardRef<CategoryFormRef, CategoryFormProps>(
  function CategoryForm(
    {
      item,
      categories,
      stores = [],
      selectedStoreId = "",
      selectedStoreIds = [],
      onSave,
    },
    ref
  ) {
    const safeCategories = useMemo(
      () => (Array.isArray(categories) ? (categories as CategoryWithMongo[]) : []),
      [categories]
    );

    const activeSelectedStoreIds = useMemo(() => {
      const fromMulti = uniqueStoreIds(selectedStoreIds);
      const fromSingle = normalizeStoreId(selectedStoreId);

      if (fromMulti.length > 0) return fromMulti;
      if (fromSingle) return [fromSingle];

      return [];
    }, [selectedStoreId, selectedStoreIds]);

    const buildInitialForm = (): CategoryWithMongo => {
      if (item) {
        const editItem = item as CategoryWithMongo;
        const itemStoreIds = getCategoryStoreIds(editItem);
        const finalStoreIds =
          itemStoreIds.length > 0 ? itemStoreIds : activeSelectedStoreIds;

        return {
          ...editItem,
          name: editItem.name || "",
          storeId: finalStoreIds[0] || "",
          storeIds: finalStoreIds,
          image: editItem.image || "",
          showOnHomePage: Boolean(editItem.showOnHomePage),
          status: (editItem.status || "Active") as CategoryStatus,
          sortOrder: Number(editItem.sortOrder ?? 0),
        };
      }

      return {
        id: "",
        name: "",
        storeId: activeSelectedStoreIds[0] || "",
        storeIds: activeSelectedStoreIds,
        image: "",
        showOnHomePage: false,
        status: "Active" as CategoryStatus,
        sortOrder: safeCategories.length + 1,
      };
    };

    const [form, setForm] = useState<CategoryWithMongo>(buildInitialForm);

    useEffect(() => {
      setForm(buildInitialForm());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item]);

    // Toggle a store in/out of the form's storeIds array
    const toggleStore = (storeSlug: string) => {
      setForm((prev) => {
        const current = Array.isArray(prev.storeIds) ? prev.storeIds : [];
        const has = current.includes(storeSlug);
        const next = has
          ? current.filter((s) => s !== storeSlug)
          : [...current, storeSlug];
        return {
          ...prev,
          storeIds: next,
          storeId: next[0] || "",
        };
      });
    };

    const submit = () => {
      const name = cleanText(form.name);
      const submitStoreIds = uniqueStoreIds([
        ...(Array.isArray(form.storeIds) ? form.storeIds : []),
        ...(Array.isArray(form.stores) ? form.stores : []),
        ...activeSelectedStoreIds,
        form.storeId,
      ]);

      if (!name) return alert("Category name required");

      if (submitStoreIds.length === 0) {
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

        return submitStoreIds.some((storeId) => categoryStoreIds.includes(storeId));
      });

      if (duplicate) {
        return alert(`Category "${name}" already exists for selected store.`);
      }

      onSave({
        ...form,
        name,
        storeId: submitStoreIds[0],
        storeIds: submitStoreIds,
        stores: submitStoreIds,
        image: form.image || "",
        showOnHomePage: Boolean(form.showOnHomePage),
        status: (form.status || "Active") as CategoryStatus,
        sortOrder: Number(form.sortOrder ?? 0),
      });
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

    useImperativeHandle(ref, () => ({ submit }));

    return (
      <>
        <FormInput
          label="Category Name"
          value={String(form.name || "")}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              name: value,
            }))
          }
          placeholder="Pizzas"
        />

        {/* Store Assignment */}
        {stores.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 p-4">
            <p className="mb-3 text-sm font-black text-zinc-700">Assign to Stores</p>
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => {
                const storeKey =
                  store.slug ||
                  store._id ||
                  store.id ||
                  store.name;
                const isChecked = Array.isArray(form.storeIds)
                  ? form.storeIds.includes(storeKey)
                  : false;
                return (
                  <button
                    key={storeKey}
                    type="button"
                    onClick={() => toggleStore(storeKey)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition ${
                      isChecked
                        ? "bg-green-800 text-white"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-green-700 hover:bg-green-50 hover:text-green-800"
                    }`}
                  >
                    <span
                      className={`h-3.5 w-3.5 rounded-full border-2 ${
                        isChecked
                          ? "border-white bg-white"
                          : "border-zinc-400"
                      }`}
                    />
                    {store.name}
                  </button>
                );
              })}
            </div>
            {Array.isArray(form.storeIds) && form.storeIds.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                No stores selected — category will not be visible.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Sort Order"
            value={String(form.sortOrder ?? 0)}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                sortOrder: Number(value || 0),
              }))
            }
            type="number"
            placeholder="0"
          />

          <FormSelect
            label="Status"
            value={String(form.status || "Active")}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                status: value as CategoryStatus,
              }))
            }
            options={["Active", "Inactive"]}
          />

          <FormSelect
            label="Show on Home Page"
            value={form.showOnHomePage ? "Yes" : "No"}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                showOnHomePage: value === "Yes",
              }))
            }
            options={["Yes", "No"]}
          />
        </div>

        <div className="mt-4">
          <ImageUploadBox
            label="Category Image (Optional)"
            image={form.image}
            alt="Category"
            onUpload={handleImageUpload}
            onRemove={() => setForm((prev) => ({ ...prev, image: "" }))}
          />
        </div>
      </>
    );
  }
);

CategoryForm.displayName = "CategoryForm";

export default CategoryForm;