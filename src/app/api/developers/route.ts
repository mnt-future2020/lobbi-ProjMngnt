import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Developer from "@/lib/models/Developer";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "0"); // 0 means no pagination
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    if (dateFrom || dateTo) {
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
      filter.createdAt = dateFilter;
    }

    // If page=0, return all (for dropdowns etc)
    if (page === 0) {
      const developers = await Developer.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(developers);
    }

    const [total, developers] = await Promise.all([
      Developer.countDocuments(filter),
      Developer.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: developers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/developers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch developers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const phone = (formData.get("phone") as string) || "";
    const file = formData.get("avatar") as File | null;

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 }
      );
    }

    let avatar = "";
    if (file && file.size > 0) {
      const { url } = await uploadToCloudinary(file, "lobbi/developers");
      avatar = url;
    }

    const developer = await Developer.create({
      name,
      email,
      password,
      role,
      phone,
      avatar,
    });

    return NextResponse.json(developer, { status: 201 });
  } catch (error) {
    console.error("POST /api/developers error:", error);
    return NextResponse.json(
      { error: "Failed to create developer" },
      { status: 500 }
    );
  }
}
