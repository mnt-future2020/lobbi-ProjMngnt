import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Developer from "@/lib/models/Developer";
import AttendanceLog from "@/lib/models/AttendanceLog";
import Role from "@/lib/models/Role";
import { signToken } from "@/lib/auth";

const ADMIN_EMAIL = "kansha@mntfuture.com";
const ADMIN_PASSWORD = "mkan2312";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Admin login
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = signToken({
        id: "admin",
        email: ADMIN_EMAIL,
        role: "admin",
        isAdmin: true,
      });

      const response = NextResponse.json({
        user: { name: "Admin", email: ADMIN_EMAIL, role: "admin", isAdmin: true },
        message: "Login successful",
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    // Developer login
    await connectDB();
    const developer = await Developer.findOne({ email });

    if (!developer) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await developer.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (developer.status === "inactive") {
      return NextResponse.json(
        { error: "Account is inactive. Contact admin." },
        { status: 403 }
      );
    }

    const token = signToken({
      id: developer._id.toString(),
      email: developer.email,
      role: developer.role,
      isAdmin: false,
    });

    // Record attendance login — auto-detect "Back from Lunch"
    try {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      const date = istDate.toISOString().split("T")[0];

      // Check last attendance entry for this developer
      const lastLog = await AttendanceLog.findOne({ developer: developer._id })
        .sort({ timestamp: -1 })
        .lean() as { action?: string; remark?: string } | null;

      const loginRemark =
        lastLog?.action === "logout" && lastLog?.remark === "Going to Lunch"
          ? "Back from Lunch"
          : null;

      await AttendanceLog.create({ developer: developer._id, action: "login", remark: loginRemark, timestamp: now, date });
    } catch (e) {
      console.error("Attendance log error:", e);
    }

    // Fetch role permissions
    let permissions: string[] = [];
    try {
      const roleDoc = await Role.findOne({ name: developer.role }).lean() as { permissions?: string[] } | null;
      permissions = roleDoc?.permissions || [];
    } catch (e) {
      console.error("Role lookup error:", e);
    }

    const response = NextResponse.json({
      user: {
        _id: developer._id,
        name: developer.name,
        email: developer.email,
        role: developer.role,
        avatar: developer.avatar,
        isAdmin: false,
        permissions,
      },
      message: "Login successful",
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
