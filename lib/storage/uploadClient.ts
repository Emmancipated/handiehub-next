"use client";

export type UploadFolder = "avatars" | "listings" | "products";

/**
 * Upload a file straight to R2 using a presigned PUT URL from our API.
 * Returns the public URL to persist on the record.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder = "listings",
): Promise<string> {
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, folder }),
  });

  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(data.error || "Could not prepare the upload");
  }

  const { uploadUrl, publicUrl, headers } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
    headers?: Record<string, string>;
  };

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: headers ?? { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("Image upload failed");
  }

  return publicUrl;
}
