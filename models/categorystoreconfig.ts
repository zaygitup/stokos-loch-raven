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
      index: true,
      trim: true,
    },
    storeId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    categoryName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    categorySlug: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Hidden", "Inactive"],
      default: "Active",
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
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
  { unique: true }
);
CategoryStoreConfigSchema.index({ storeId: 1, status: 1, sortOrder: 1 });

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
