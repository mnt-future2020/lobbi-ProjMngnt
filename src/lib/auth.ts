import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import Developer from "./models/Developer";
import Role from "./models/Role";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  isAdmin?: boolean;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Admin gets all permissions
  if (payload.isAdmin) {
    return { _id: "admin", name: "Admin", email: "admin", role: "admin", isAdmin: true, permissions: [] as string[] };
  }

  await connectDB();
  const developer = await Developer.findById(payload.id).lean() as Record<string, unknown> | null;
  if (!developer) return null;

  // Look up the role's permissions
  let permissions: string[] = [];
  if (developer.role) {
    const roleDoc = await Role.findOne({ name: developer.role }).lean() as { permissions?: string[] } | null;
    permissions = roleDoc?.permissions || [];
  }

  return { ...developer, isAdmin: false, permissions };
}
