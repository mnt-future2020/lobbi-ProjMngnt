import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Developer from "@/lib/models/Developer";
import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const developer = await Developer.findById(params.id)
      .select("-password")
      .lean();
    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(developer);
  } catch (error) {
    console.error("GET /api/developers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch developer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const phone = (formData.get("phone") as string) || "";
    const status = (formData.get("status") as string) || "active";
    const password = formData.get("password") as string;
    const file = formData.get("avatar") as File | null;

    const updateData: Record<string, unknown> = {
      name,
      email,
      role,
      phone,
      status,
    };

    if (password && password.length >= 4) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (file && file.size > 0) {
      const { url } = await uploadToCloudinary(file, "lobbi/developers");
      updateData.avatar = url;
    }

    const developer = await Developer.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )
      .select("-password")
      .lean();

    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(developer);
  } catch (error) {
    console.error("PUT /api/developers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update developer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const developer = await Developer.findByIdAndDelete(params.id);
    if (!developer) {
      return NextResponse.json(
        { error: "Developer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Developer deleted" });
  } catch (error) {
    console.error("DELETE /api/developers/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete developer" },
      { status: 500 }
    );
  }
}
