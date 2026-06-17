import mongoose, { Schema } from "mongoose";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },

    // Kept for admin compatibility only. Frontend menu categories are no longer
    // filtered by storeId; all active categories from this collection are shown.
    storeId: {
      type: String,
      default: "",
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Hidden", "Inactive"],
      default: "Active",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    hidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "categories",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CategorySchema.virtual("storeConfigs", {
  ref: "CategoryStoreConfig",
  localField: "_id",
  foreignField: "categoryId",
  justOne: false,
});

CategorySchema.pre("validate", function () {
  const doc = this as any;

  doc.name = cleanString(doc.name || doc.title);
  doc.title = cleanString(doc.title);
  doc.description = cleanString(doc.description);
  doc.image = cleanString(doc.image || doc.imageUrl || doc.thumbnail);
  doc.imageUrl = cleanString(doc.imageUrl);
  doc.thumbnail = cleanString(doc.thumbnail);
  doc.storeId = cleanString(doc.storeId);
  doc.sortOrder = Number(doc.sortOrder || 0);

  if (!doc.slug && doc.name) {
    doc.slug = slugify(doc.name);
  }

  if (doc.slug) {
    doc.slug = slugify(doc.slug);
  }
});

CategorySchema.index({ slug: 1 });
CategorySchema.index({ name: 1 });
CategorySchema.index({ status: 1, sortOrder: 1 });
CategorySchema.index({ status: 1, slug: 1 });
CategorySchema.index({ sortOrder: 1, updatedAt: -1 });

if (process.env.NODE_ENV === "development" && mongoose.models.Category) {
  delete mongoose.models.Category;
}

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;
