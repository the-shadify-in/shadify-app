import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/r2";
import { getAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Only authenticated staff / couple members can request upload presigns
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weddingSlug, filename, contentType, tier = "preview" } = await request.json();

    if (!weddingSlug || !filename || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields: weddingSlug, filename, contentType" },
        { status: 400 }
      );
    }

    // Generate safe key: weddings/[slug]/[tier]/[timestamp]-[clean-filename]
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `weddings/${weddingSlug}/${tier}/${Date.now()}-${cleanFilename}`;

    const uploadUrl = await createPresignedUploadUrl(key, contentType, 300);

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
