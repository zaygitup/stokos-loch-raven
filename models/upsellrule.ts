import mongoose, { Schema } from "mongoose";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const UpsellRuleSchema = new Schema(
  {
    storeId: {
      type: String,
      required: true,
      default: "towson",
      index: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Category that triggers this upsell rule.
    triggerCategoryId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    triggerCategoryName: {
      type: String,
      required: true,
      trim: true,
    },

    // Multiple offered products.
    // Pricing/image/name will come from Product model.
    offerProductIds: {
      type: [String],
      required: true,
      validate: {
        validator(value: string[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one offer product is required.",
      },
      default: [],
    },

    // Legacy/readable support.
    trigger: {
      type: String,
      default: "",
    },

    offer: {
      type: String,
      default: "",
      trim: true,
    },

    appliesToCategories: {
      type: [String],
      default: [],
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Paused", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    collection: "upsellrules",
  }
);

UpsellRuleSchema.pre("validate", function () {
  const doc = this as any;

  const categoryName = String(doc.triggerCategoryName || "").trim();
  const categoryId = String(doc.triggerCategoryId || "").trim();

  if (!doc.name) {
    doc.name = categoryName ? `${categoryName} Upsells` : "Category Upsells";
  }

  if (!doc.slug) {
    doc.slug = slugify(`${categoryName || categoryId}-upsells`);
  }

  if (!doc.trigger) {
    doc.trigger = categoryName ? `Any ${categoryName}` : "Any Category Product";
  }

  if (!doc.offer) {
    const count = Array.isArray(doc.offerProductIds)
      ? doc.offerProductIds.length
      : 0;

    doc.offer = `${count} offer product${count === 1 ? "" : "s"}`;
  }

  if (!Array.isArray(doc.appliesToCategories) || doc.appliesToCategories.length === 0) {
    doc.appliesToCategories = categoryName ? [categoryName] : [];
  }
});

// One category rule per store.
UpsellRuleSchema.index(
  { storeId: 1, triggerCategoryId: 1 },
  { unique: true }
);

const UpsellRule =
  mongoose.models.UpsellRule ||
  mongoose.model("UpsellRule", UpsellRuleSchema);

export default UpsellRule;