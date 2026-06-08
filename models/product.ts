import mongoose, { Schema } from "mongoose";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ProductSchema = new Schema(
  {
    // Product Master = common/global data only.
    // Store/category/price/size/modifier/status/sortOrder live in ProductStoreConfig.
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    badge: {
      type: String,
      default: "",
    },

    updatedAt: {
      type: String,
      default: "Today",
    },

    // Legacy fields are intentionally optional so old rows do not break during migration.
    // New writes should not depend on these fields.
    storeId: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    categoryId: { type: String, default: "", trim: true },
    categoryName: { type: String, default: "", trim: true },
    price: { type: Number, default: 0 },
    sizes: { type: Array, default: [] },
    modifierGroups: { type: Array, default: [] },
    modifierGroupIds: { type: [String], default: [] },
    relatedUpsells: { type: [String], default: [] },
    upsell: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Active", "Draft", "Hidden", "Inactive"],
      default: "Active",
    },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "lastSavedAt",
    },
    collection: "products",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductSchema.virtual("storeConfigs", {
  ref: "ProductStoreConfig",
  localField: "_id",
  foreignField: "productId",
  justOne: false,
});

ProductSchema.pre("validate", function () {
  const doc = this as any;

  if (doc.name) {
    doc.name = String(doc.name || "").trim();
  }

  if (!doc.slug && doc.name) {
    doc.slug = slugify(doc.name);
  }

  if (doc.slug) {
    doc.slug = slugify(doc.slug);
  }

  if (!doc.updatedAt) {
    doc.updatedAt = "Today";
  }
});

ProductSchema.index({ slug: 1 });
ProductSchema.index({ name: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
