import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

/**
 * Server-side permission check for API routes.
 * Returns null if allowed, or an error NextResponse if denied.
 *
 * Admin always passes. Non-admin users are checked against their role permissions.
 *
 * Usage in API route:
 *   const denied = await checkPermission("tasks.delete");
 *   if (denied) return denied;
 */
export async function checkPermission(requiredPermission: string): Promise<NextResponse | null> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Admin bypasses all permission checks
  if ((user as any).isAdmin) return null;

  const permissions: string[] = (user as any).permissions || [];

  let allowed = permissions.includes(requiredPermission);
  // "xxx.view_all" implies "xxx.view"
  if (!allowed && requiredPermission.endsWith(".view")) {
    allowed = permissions.includes(requiredPermission.replace(".view", ".view_all"));
  }

  if (!allowed) {
    return NextResponse.json(
      { error: `Permission denied: ${requiredPermission} required` },
      { status: 403 }
    );
  }

  return null;
}
