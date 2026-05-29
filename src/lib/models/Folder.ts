import mongoose, { Schema, Document } from "mongoose";

export interface IFolderDoc extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
  order: number;
  color: string | null;
}

const FolderSchema = new Schema(
  {
    name: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    order: { type: Number, default: 0 },
    color: { type: String, default: null },
  },
  { timestamps: true }
);

FolderSchema.index({ project: 1, order: 1 });

export default mongoose.models.Folder ||
  mongoose.model<IFolderDoc>("Folder", FolderSchema);
