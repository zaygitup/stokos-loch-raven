import mongoose, { Schema } from "mongoose";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CategorySchema = new Schema(
  {
    // Category Master = common/global category data only.
    // Store-wise availability/status/sortOrder now live in CategoryStoreConfig.
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

    // Legacy optional fields so old category routes/data do not crash during migration.
    storeId: { type: String, default: "", trim: true },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Hidden", "Inactive"],
      default: "Active",
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

  if (!doc.slug && doc.name) {
    doc.slug = slugify(doc.name);
  }
});

CategorySchema.index({ slug: 1 });
CategorySchema.index({ name: 1 });

if (process.env.NODE_ENV === "development" && mongoose.models.Category) {
  delete mongoose.models.Category;
}

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;
