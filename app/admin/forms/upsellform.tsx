"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ChangeEvent,
} from "react";

import type { Category, Product, UpsellRule, UpsellStatus } from "../menu/types";
import { FormInput, FormSelect } from "../menu/components/ui";
import ImageUploadBox from "../adminmenumodel/imageuploadbox";

export type UpsellFormRef = {
  submit: () => void;
};

type CategoryWithMongo = Category & {
  _id?: string;
};

type ProductWithMongo = Product & {
  _id?: string;
  slug?: string;
};

type UpsellFormProps = {
  item: UpsellRule | null;
  categories: Category[];
  products: Product[];
  selectedStoreId?: string;
  onSave: (value: any) => void;
};

type UpsellFormState = {
  _id?: string;
  id?: string;
  storeId: string;
  name: string;
  triggerCategoryId: string;
  triggerCategoryName: string;
  offerProductIds: string[];
  trigger: string;
  offer: string;
  image: string;
  appliesToCategories: string[];
  sortOrder?: number;
  status: UpsellStatus;
};

function getCategoryId(category: CategoryWithMongo) {
  return String(category._id || category.id || category.slug || category.name || "").trim();
}

function getProductId(product: ProductWithMongo) {
  return String(product._id || product.id || product.slug || product.name || "").trim();
}

const UpsellForm = forwardRef<UpsellFormRef, UpsellFormProps>(
  function UpsellForm(
    { item, categories, products, selectedStoreId = "", onSave },
    ref
  ) {
    const safeCategories = Array.isArray(categories)
      ? (categories as CategoryWithMongo[])
      : [];

    const safeProducts = Array.isArray(products)
      ? (products as ProductWithMongo[])
      : [];

    const [form, setForm] = useState<UpsellFormState>(() => {
      if (item) {
        const upsell = item as UpsellRule;

        return {
          _id: upsell._id,
          id: upsell.id,
          storeId: upsell.storeId || selectedStoreId,
          name: upsell.name || "",
          triggerCategoryId: upsell.triggerCategoryId || "",
          triggerCategoryName:
            upsell.triggerCategoryName ||
            upsell.appliesToCategories?.[0] ||
            "",
          offerProductIds: Array.isArray(upsell.offerProductIds)
            ? upsell.offerProductIds
            : [],
          trigger: upsell.trigger || "",
          offer: upsell.offer || upsell.name || "",
          image: upsell.image || "",
          appliesToCategories: Array.isArray(upsell.appliesToCategories)
            ? upsell.appliesToCategories
            : [],
          sortOrder: upsell.sortOrder || 0,
          status: upsell.status || "Active",
        };
      }

      return {
        id: "",
        storeId: selectedStoreId,
        name: "",
        triggerCategoryId: "",
        triggerCategoryName: "",
        offerProductIds: [],
        trigger: "",
        offer: "",
        image: "",
        appliesToCategories: [],
        sortOrder: 0,
        status: "Active",
      };
    });

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        event.target.value = "";
        return;
      }

      if (file.size > 1.5 * 1024 * 1024) {
        alert("Image is too large. Please upload an image under 1.5MB.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") return;

        setForm((prev) => ({
          ...prev,
          image: result,
        }));
      };

      reader.readAsDataURL(file);
      event.target.value = "";
    };

    const toggleOfferProduct = (productId: string) => {
      setForm((prev) => {
        const exists = prev.offerProductIds.includes(productId);

        return {
          ...prev,
          offerProductIds: exists
            ? prev.offerProductIds.filter((id) => id !== productId)
            : [...prev.offerProductIds, productId],
        };
      });
    };

    const submit = () => {
      if (!form.storeId) {
        return alert("Store is required for upsell");
      }

      if (!form.triggerCategoryId || !form.triggerCategoryName) {
        return alert("Trigger category is required");
      }

      if (form.offerProductIds.length === 0) {
        return alert("Select at least one offer product");
      }

      const offerLabel = `${form.offerProductIds.length} offer product${
        form.offerProductIds.length === 1 ? "" : "s"
      }`;

      onSave({
        ...form,
        storeId: form.storeId,
        name: form.name || `${form.triggerCategoryName} Upsells`,
        trigger: `Any ${form.triggerCategoryName}`,
        offer: form.offer || offerLabel,
        triggerCategoryId: form.triggerCategoryId,
        triggerCategoryName: form.triggerCategoryName,
        offerProductIds: form.offerProductIds,
        appliesToCategories: [form.triggerCategoryName],
        status: form.status || "Active",
      });
    };

    useImperativeHandle(ref, () => ({
      submit,
    }));

    return (
      <div className="space-y-5">
        <ImageUploadBox
          label="Upsell Image"
          image={form.image}
          alt={form.offer || "Upsell"}
          onUpload={handleImageUpload}
          onRemove={() =>
            setForm((prev) => ({
              ...prev,
              image: "",
            }))
          }
        />

        <FormInput
          label="Rule Name"
          value={form.name}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              name: value,
            }))
          }
          placeholder="Pizza Upsells"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Trigger Category"
            value={form.triggerCategoryName || "Select Category"}
            onChange={(value) => {
              const selectedCategory = safeCategories.find(
                (category) => category.name === value
              );

              setForm((prev) => ({
                ...prev,
                triggerCategoryId: selectedCategory
                  ? getCategoryId(selectedCategory)
                  : "",
                triggerCategoryName: selectedCategory?.name || "",
                appliesToCategories: selectedCategory?.name
                  ? [selectedCategory.name]
                  : [],
              }));
            }}
            options={[
              "Select Category",
              ...safeCategories.map((category) => category.name),
            ]}
          />

          <FormSelect
            label="Status"
            value={form.status}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                status: value as UpsellStatus,
              }))
            }
            options={["Active", "Paused", "Inactive"]}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <h4 className="text-sm font-black text-zinc-950">
            Offer Products
          </h4>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            In products ko upsell mein show kiya jayega. Price Product Model se ayegi.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {safeProducts.length === 0 && (
              <p className="text-sm font-semibold text-zinc-500">
                No products found for this store.
              </p>
            )}

            {safeProducts.map((product) => {
              const productId = getProductId(product);
              const checked = form.offerProductIds.includes(productId);

              return (
                <label
                  key={productId}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 transition hover:bg-green-50"
                >
                  <div>
                    <p className="text-sm font-black text-zinc-950">
                      {product.name}
                    </p>
                    <p className="text-xs font-semibold text-zinc-500">
                      ${Number(product.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOfferProduct(productId)}
                    className="h-4 w-4 accent-green-600"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

UpsellForm.displayName = "UpsellForm";

export default UpsellForm;