import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Developer from "@/lib/models/Developer";
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

    const response = NextResponse.json({
      user: {
        _id: developer._id,
        name: developer.name,
        email: developer.email,
        role: developer.role,
        avatar: developer.avatar,
        isAdmin: false,
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
