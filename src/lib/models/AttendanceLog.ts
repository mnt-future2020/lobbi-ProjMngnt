import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceLogDoc extends Document {
  developer: mongoose.Types.ObjectId;
  action: "login" | "logout";
  remark: string | null;
  timestamp: Date;
  date: string; // YYYY-MM-DD
}

const AttendanceLogSchema = new Schema({
  developer: { type: Schema.Types.ObjectId, ref: "Developer", required: true },
  action: { type: String, enum: ["login", "logout"], required: true },
  remark: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: true }, // YYYY-MM-DD stored in IST
});

AttendanceLogSchema.index({ developer: 1, date: -1 });
AttendanceLogSchema.index({ date: -1 });

export default mongoose.models.AttendanceLog ||
  mongoose.model<IAttendanceLogDoc>("AttendanceLog", AttendanceLogSchema);
