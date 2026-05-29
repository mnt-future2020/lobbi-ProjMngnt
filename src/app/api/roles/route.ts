import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkPermission } from "@/lib/checkPermission";
import Role from "@/lib/models/Role";
import Developer from "@/lib/models/Developer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const roles = await Role.find().sort({ name: 1 }).lean();
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await checkPermission("roles.create");
  if (denied) return denied;
  try {
    await connectDB();
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }
    const existing = await Role.findOne({ name: body.name.trim() });
    if (existing) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
    }
    const role = await Role.create({
      name: body.name.trim(),
      description: body.description?.trim() || "",
      permissions: body.permissions || [],
      color: body.color || null,
    });
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
