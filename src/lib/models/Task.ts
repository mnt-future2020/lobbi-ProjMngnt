import mongoose, { Schema, Document } from "mongoose";

export interface ITaskDoc extends Document {
  folder: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: mongoose.Types.ObjectId | null;
  project: mongoose.Types.ObjectId;
  dueDate: Date | null;
  date: Date;
  attachments: { filename: string; path: string; uploadedAt: Date }[];
}

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "Developer",
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    folder: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    dueDate: { type: Date, default: null },
    date: { type: Date, default: Date.now },
    attachments: [
      {
        filename: String,
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

TaskSchema.index({ title: "text", description: "text" });
TaskSchema.index({ project: 1, status: 1, priority: 1, assignee: 1 });
TaskSchema.index({ date: -1 });
TaskSchema.index({ createdAt: -1 });

export default mongoose.models.Task ||
  mongoose.model<ITaskDoc>("Task", TaskSchema);
