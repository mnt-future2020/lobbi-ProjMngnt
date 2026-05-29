import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Folder from "@/lib/models/Folder";
import Task from "@/lib/models/Task";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const folder = await Folder.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    return NextResponse.json(folder);
  } catch (error) {
    console.error("PATCH /api/folders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const folder = await Folder.findByIdAndDelete(params.id);
    if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    // Unlink tasks from this folder (set folder to null)
    await Task.updateMany({ folder: params.id }, { $set: { folder: null } });
    return NextResponse.json({ message: "Folder deleted" });
  } catch (error) {
    console.error("DELETE /api/folders/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
