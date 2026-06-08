import mongoose, { Schema } from "mongoose";

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

const ModifierGroupAssignmentSchema = new Schema(
  {
    modifierGroupId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    storeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    categoryId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "modifiergroupassignments",
  }
);

ModifierGroupAssignmentSchema.pre("validate", function () {
  const doc = this as any;

  doc.modifierGroupId = String(doc.modifierGroupId || "").trim();
  doc.storeId = String(doc.storeId || "").trim();
  doc.categoryName = String(doc.categoryName || "").trim();
  doc.categoryId = String(doc.categoryId || slugify(doc.categoryName) || "").trim();
  doc.sortOrder = cleanNumber(doc.sortOrder);
  doc.status = doc.status === "Inactive" ? "Inactive" : "Active";
});

ModifierGroupAssignmentSchema.index(
  { modifierGroupId: 1, storeId: 1, categoryId: 1 },
  { unique: true }
);

ModifierGroupAssignmentSchema.index({ storeId: 1, categoryId: 1, status: 1 });

const ModifierGroupAssignment =
  mongoose.models.ModifierGroupAssignment ||
  mongoose.model("ModifierGroupAssignment", ModifierGroupAssignmentSchema);

export default ModifierGroupAssignment;
