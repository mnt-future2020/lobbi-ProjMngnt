import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/lib/models/Task";
import "@/lib/models/Developer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const assignee = searchParams.get("assignee") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const dates = searchParams.get("dates") || ""; // comma-separated: "2026-04-20,2026-04-21"

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee === "unassigned") {
      filter.assignee = null;
    } else if (assignee) {
      filter.assignee = assignee;
    }

    // Multi-date filter: each date becomes a day range
    if (dates) {
      const dateConditions = dates.split(",").filter(Boolean).map((d) => {
        const from = new Date(d);
        from.setHours(0, 0, 0, 0);
        const to = new Date(d);
        to.setHours(23, 59, 59, 999);
        return { date: { $gte: from, $lte: to } };
      });
      if (dateConditions.length === 1) {
        filter.date = dateConditions[0].date;
      } else if (dateConditions.length > 1) {
        // Merge with existing $or if search is also present
        if (filter.$or) {
          const searchOr = filter.$or;
          delete filter.$or;
          filter.$and = [
            { $or: searchOr as Record<string, unknown>[] },
            { $or: dateConditions },
          ];
        } else {
          filter.$or = dateConditions;
        }
      }
    } else if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        dateFilter.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.$lte = to;
      }
      filter.date = dateFilter;
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    // Run count and find in parallel
    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .populate("assignee", "name email avatar role")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const task = await Task.create(body);
    const populated = await Task.findById(task._id)
      .populate("assignee", "name email avatar role")
      .lean();
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
