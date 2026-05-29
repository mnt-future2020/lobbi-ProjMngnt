import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Folder from "@/lib/models/Folder";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const project = searchParams.get("project") || "";

    const filter: Record<string, unknown> = {};
    if (project) filter.project = project;

    const folders = await Folder.find(filter).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(folders);
  } catch (error) {
    console.error("GET /api/folders error:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }
    if (!body.project) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    // Set order to max + 1
    const last = await Folder.findOne({ project: body.project }).sort({ order: -1 }).lean();
    const order = last ? (last as any).order + 1 : 0;

    const folder = await Folder.create({ ...body, order });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("POST /api/folders error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
