import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/lib/models/Task";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const assignee = searchParams.get("assignee") || "";

    // Build match stage for optional assignee filter
    const matchStage: Record<string, unknown> = {};
    if (assignee) {
      matchStage.assignee = new mongoose.Types.ObjectId(assignee);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push({
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
    });

    const [stats] = await Task.aggregate(pipeline);

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
