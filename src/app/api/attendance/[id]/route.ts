import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkPermission } from "@/lib/checkPermission";
import AttendanceLog from "@/lib/models/AttendanceLog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await checkPermission("attendance.edit");
  if (denied) return denied;
  try {
    await connectDB();
    const body = await req.json();
    const log = await AttendanceLog.findByIdAndUpdate(params.id, body, { new: true })
      .populate("developer", "name email avatar role")
      .lean();
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await checkPermission("attendance.delete");
  if (denied) return denied;
  try {
    await connectDB();
    await AttendanceLog.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
