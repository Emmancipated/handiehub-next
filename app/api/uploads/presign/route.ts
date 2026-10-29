import { NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, AuthError } from "@/lib/auth/current-user";
import {
  ALLOWED_UPLOAD_TYPES,
  buildObjectKey,
  createPresignedPutUrl,
  isR2Configured,
} from "@/lib/storage/r2";

const ALLOWED_FOLDERS = ["avatars", "listings", "products"] as const;

const presignSchema = z.object({
  contentType: z.enum(ALLOWED_UPLOAD_TYPES),
  folder: z.enum(ALLOWED_FOLDERS).default("listings"),
});

/**
 * Issue a presigned PUT URL so images go straight to Cloudflare R2 from the
 * browser. The app server never handles the file bytes.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireVerifiedUser();

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error: "Image uploads are not configured on this environment",
          code: "UPLOADS_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const data = presignSchema.parse(body);

    const key = buildObjectKey(data.folder, userId, data.contentType);
    const presigned = await createPresignedPutUrl({
      key,
      contentType: data.contentType,
    });

    return NextResponse.json({
      uploadUrl: presigned.uploadUrl,
      publicUrl: presigned.publicUrl,
      key,
      expiresInSeconds: presigned.expiresInSeconds,
      headers: { "Content-Type": data.contentType },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
