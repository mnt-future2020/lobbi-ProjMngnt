import mongoose, { Schema, Document } from "mongoose";

export interface IProjectDoc extends Document {
  name: string;
  description: string;
  status: "active" | "archived";
  members: mongoose.Types.ObjectId[];
}

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "Developer",
      },
    ],
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ name: "text" });

export default mongoose.models.Project ||
  mongoose.model<IProjectDoc>("Project", ProjectSchema);
