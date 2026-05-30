import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file");

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", blob.type || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename || "download")}"`
    );

    return new NextResponse(blob, { headers });
  } catch {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
