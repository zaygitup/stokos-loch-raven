import mongoose, { Schema } from "mongoose";

const AdminEmailSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    addedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "adminemails",
  }
);

const AdminEmail =
  mongoose.models.AdminEmail ||
  mongoose.model("AdminEmail", AdminEmailSchema);

export default AdminEmail;
