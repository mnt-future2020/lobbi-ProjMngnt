import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";
import "@/lib/models/Developer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const member = searchParams.get("member") || "";

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by member — show only projects this user belongs to
    if (member) {
      filter.members = member;
    }

    const projects = await Project.find(filter)
      .populate("members", "name email avatar role status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const project = await Project.create(body);
    const populated = await Project.findById(project._id)
      .populate("members", "name email avatar role status")
      .lean();
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
