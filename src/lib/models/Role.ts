import mongoose, { Schema, Document } from "mongoose";

export interface IRoleDoc extends Document {
  name: string;
  description: string;
  permissions: string[];
  color: string | null;
}

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    permissions: [{ type: String }],
    color: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Role ||
  mongoose.model<IRoleDoc>("Role", RoleSchema);
