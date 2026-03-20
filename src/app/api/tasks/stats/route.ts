import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/lib/models/Task";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const [stats] = await Task.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date(), $ne: null },
                status: { $ne: "Completed" },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    const total = stats.total[0]?.count || 0;
    const overdue = stats.overdue[0]?.count || 0;

    const statusMap: Record<string, number> = {};
    for (const s of stats.byStatus) {
      statusMap[s._id] = s.count;
    }

    return NextResponse.json({
      total,
      completed: statusMap["Completed"] || 0,
      pending: statusMap["Pending"] || 0,
      inProgress: statusMap["In Progress"] || 0,
      overdue,
    });
  } catch (error) {
    console.error("GET /api/tasks/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
