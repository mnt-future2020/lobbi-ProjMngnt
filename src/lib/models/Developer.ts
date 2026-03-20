import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IDeveloperDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: string;
  phone: string;
  status: "active" | "inactive";
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const DeveloperSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Hash password before saving
DeveloperSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
DeveloperSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from JSON output by default
DeveloperSchema.set("toJSON", {
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    const { password: _, ...rest } = ret;
    return rest;
  },
});

export default mongoose.models.Developer ||
  mongoose.model<IDeveloperDoc>("Developer", DeveloperSchema);
