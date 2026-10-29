import { AwsClient } from "aws4fetch";

export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicBaseUrl
  ) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

export function extensionForContentType(contentType: string): string | null {
  return EXTENSION_BY_TYPE[contentType] ?? null;
}

export function buildObjectKey(
  folder: string,
  userId: string,
  contentType: string,
): string {
  const ext = extensionForContentType(contentType) ?? "bin";
  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  return `${folder}/${userId}/${unique}.${ext}`;
}

export function getPublicUrl(key: string): string {
  const config = getR2Config();
  if (!config) {
    throw new Error("R2 is not configured");
  }
  return `${config.publicBaseUrl}/${key}`;
}

/**
 * Create a short-lived presigned PUT URL. The client uploads the file directly
 * to R2 (zero egress from the app server), then stores the returned public URL.
 */
export async function createPresignedPutUrl({
  key,
  contentType,
  expiresInSeconds = 600,
}: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; expiresInSeconds: number }> {
  const config = getR2Config();
  if (!config) {
    throw new Error("R2 is not configured");
  }

  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const endpoint = new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`,
  );
  // aws4fetch defaults the expiry to 86400s; setting it here keeps presigned
  // URLs short-lived.
  endpoint.searchParams.set("X-Amz-Expires", String(expiresInSeconds));

  const signed = await client.sign(
    new Request(endpoint, {
      method: "PUT",
      headers: { "content-type": contentType },
    }),
    { aws: { signQuery: true } },
  );

  return {
    uploadUrl: signed.url,
    publicUrl: `${config.publicBaseUrl}/${key}`,
    expiresInSeconds,
  };
}
