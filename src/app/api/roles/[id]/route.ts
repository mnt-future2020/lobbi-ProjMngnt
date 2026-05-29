import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkPermission } from "@/lib/checkPermission";
import Role from "@/lib/models/Role";
import Developer from "@/lib/models/Developer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await checkPermission("roles.edit");
  if (denied) return denied;
  try {
    await connectDB();
    const body = await req.json();

    if (body.name) {
      const existing = await Role.findOne({ name: body.name.trim(), _id: { $ne: params.id } });
      if (existing) {
        return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
      }
      body.name = body.name.trim();
    }

    const role = await Role.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await checkPermission("roles.delete");
  if (denied) return denied;
  try {
    await connectDB();

    // Check if any user has this role
    const role = await Role.findById(params.id).lean() as { name?: string } | null;
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    const usersWithRole = await Developer.countDocuments({ role: (role as any).name });
    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${usersWithRole} user(s) have this role. Reassign them first.` },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Role deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
