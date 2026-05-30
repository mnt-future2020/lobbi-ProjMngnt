import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkPermission } from "@/lib/checkPermission";
import Task from "@/lib/models/Task";
import "@/lib/models/Developer";

const POPULATE = [
  { path: "assignees", select: "name email avatar role" },
  { path: "assignee", select: "name email avatar role" },
  { path: "folder", select: "name" },
];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const task = await Task.findById(params.id).populate(POPULATE).lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await checkPermission("tasks.edit");
  if (denied) return denied;
  try {
    await connectDB();
    const body = await req.json();
    const task = await Task.findByIdAndUpdate(params.id, body, { new: true })
      .populate(POPULATE)
      .lean();
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await checkPermission("tasks.delete");
  if (denied) return denied;
  try {
    await connectDB();
    const task = await Task.findByIdAndDelete(params.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
