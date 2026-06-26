import mongoose, { Schema } from "mongoose";

// Per-day-of-week hours. Index 0 = Sunday … 6 = Saturday.
// Times are 24h "HH:mm" strings in the store's local timezone.
const DayHoursSchema = new Schema(
  {
    open: { type: String, default: "" },
    close: { type: String, default: "" },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const StoreSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    openingHours: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
    },

    minimumOrder: {
      type: Number,
      default: 0,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // Branch pinpoint + delivery service area (configurable in admin).
    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    deliveryRadiusKm: {
      type: Number,
      default: 8,
    },

    // Store-local timezone used to compute "now + 30 min" and the weekday
    // for the scheduled-time picker.
    timezone: {
      type: String,
      default: "America/New_York",
      trim: true,
    },

    // Structured per-day hours (Sun..Sat) for the time picker constraints.
    // Kept separate from the free-text `openingHours` used for display.
    hours: {
      type: [DayHoursSchema],
      default: () =>
        Array.from({ length: 7 }, () => ({
          open: "11:00",
          close: "23:00",
          closed: false,
        })),
    },
  },
  {
    timestamps: true,
    collection: "stores",
  }
);

const Store = mongoose.models.Store || mongoose.model("Store", StoreSchema);

export default Store;