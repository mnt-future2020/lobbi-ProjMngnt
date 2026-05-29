import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkPermission } from "@/lib/checkPermission";
import AttendanceLog from "@/lib/models/AttendanceLog";

export const dynamic = "force-dynamic";

// GET /api/attendance?developer=id&date=YYYY-MM-DD&startDate=...&endDate=...
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const developer = searchParams.get("developer");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: Record<string, unknown> = {};
    if (developer) filter.developer = developer;
    if (date) {
      filter.date = date;
    } else if (startDate || endDate) {
      const dateRange: Record<string, string> = {};
      if (startDate) dateRange.$gte = startDate;
      if (endDate) dateRange.$lte = endDate;
      filter.date = dateRange;
    }

    const logs = await AttendanceLog.find(filter)
      .populate("developer", "name email avatar role")
      .sort({ timestamp: 1 })
      .lean();

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/attendance  { developer, action, remark? }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { developer, action, remark } = body;

    if (!developer || !action) {
      return NextResponse.json({ error: "developer and action are required" }, { status: 400 });
    }

    const now = new Date();
    // Store date in IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const date = istDate.toISOString().split("T")[0];

    const log = await AttendanceLog.create({
      developer,
      action,
      remark: remark?.trim() || null,
      timestamp: now,
      date,
    });

    const populated = await AttendanceLog.findById(log._id)
      .populate("developer", "name email avatar role")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to create attendance log" }, { status: 500 });
  }
}

// DELETE /api/attendance?date=YYYY-MM-DD  (bulk clear by date)
export async function DELETE(req: NextRequest) {
  const denied = await checkPermission("attendance.delete");
  if (denied) return denied;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const filter: Record<string, unknown> = {};
    if (date) filter.date = date;

    const result = await AttendanceLog.deleteMany(filter);
    return NextResponse.json({ deleted: result.deletedCount });
  } catch (error) {
    console.error("DELETE /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to clear attendance" }, { status: 500 });
  }
}
