import mongoose, { Schema } from "mongoose";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStoreId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

const CategoryStoreConfigSchema = new Schema(
  {
    categoryId: {
      type: String,
      required: true,
      trim: true,
    },
    storeId: {
      type: String,
      required: true,
      trim: true,
    },
    categoryName: {
      type: String,
      default: "",
      trim: true,
    },
    categorySlug: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Hidden", "Inactive"],
      default: "Active",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "categorystoreconfigs",
  }
);

CategoryStoreConfigSchema.pre("validate", function () {
  const doc = this as any;

  doc.categoryId = String(doc.categoryId || "").trim();
  doc.storeId = normalizeStoreId(doc.storeId);

  if (!doc.categorySlug && doc.categoryName) {
    doc.categorySlug = slugify(doc.categoryName);
  }
});

CategoryStoreConfigSchema.index(
  { categoryId: 1, storeId: 1 },
  { unique: true, name: "unique_category_store_config" }
);
CategoryStoreConfigSchema.index({ storeId: 1, status: 1, sortOrder: 1 });
CategoryStoreConfigSchema.index({ storeId: 1, status: 1, available: 1, sortOrder: 1 });
CategoryStoreConfigSchema.index({ storeId: 1, status: 1, categorySlug: 1, sortOrder: 1 });
CategoryStoreConfigSchema.index({ categoryId: 1 });

if (
  process.env.NODE_ENV === "development" &&
  mongoose.models.CategoryStoreConfig
) {
  delete mongoose.models.CategoryStoreConfig;
}

const CategoryStoreConfig =
  mongoose.models.CategoryStoreConfig ||
  mongoose.model("CategoryStoreConfig", CategoryStoreConfigSchema);

export default CategoryStoreConfig;
