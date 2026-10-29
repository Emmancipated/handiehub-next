import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVerifiedUser, AuthError } from "@/lib/auth/current-user";
import { normalizePhone, phoneCountry } from "@/lib/phone";
import {
  deliveryEstimateSchema,
  deliveryToMinutes,
} from "@/lib/seller/delivery";
import {
  isSellerProfileComplete,
  serializeSellerProfile,
} from "@/lib/seller/profile";
import { responseTimeSchema } from "@/lib/seller/responseTime";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim())
    .optional();

const profileFieldsSchema = z.object({
  businessName: optionalTrimmedString(160),
  description: optionalTrimmedString(2000),
  phoneNumber: optionalTrimmedString(32),
  country: z
    .string()
    .length(2)
    .transform((value) => value.toUpperCase())
    .optional(),
  state: optionalTrimmedString(100),
  city: optionalTrimmedString(100),
  address: optionalTrimmedString(255),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  professions: z.array(z.string().min(1).max(80)).max(20).optional(),
  skills: z.array(z.string().min(1).max(80)).max(50).optional(),
  productsImageUrl: z.array(z.string().url().max(500)).max(30).optional(),
  responseTime: responseTimeSchema.nullable().optional(),
  intraStateDelivery: deliveryEstimateSchema.nullable().optional(),
  interStateDelivery: deliveryEstimateSchema.nullable().optional(),
});

const createProfileSchema = profileFieldsSchema.extend({
  businessName: z.string().min(2).max(160).transform((v) => v.trim()),
});

type ProfileInput = z.infer<typeof profileFieldsSchema>;

function definedOnly(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

function validationResponse(error: z.ZodError) {
  const issue = error.issues[0];
  return NextResponse.json(
    {
      error: issue?.message ?? "Please check the form and try again",
      code: "VALIDATION_ERROR",
      field: issue?.path.length ? issue.path.join(".") : undefined,
      issues: error.issues,
    },
    { status: 400 },
  );
}

async function applyProfileUpdate(userId: string, input: ProfileInput) {
  const {
    intraStateDelivery,
    interStateDelivery,
    phoneNumber,
    ...rest
  } = input;
  const updateData = definedOnly(rest);

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (!existing && !updateData.businessName) {
    return {
      error: NextResponse.json(
        { error: "Business name is required", code: "BUSINESS_NAME_REQUIRED" },
        { status: 400 },
      ),
    };
  }

  if (phoneNumber !== undefined) {
    if (!phoneNumber.trim()) {
      updateData.phoneNumber = null;
    } else {
      const country = input.country ?? existing?.country ?? "NG";
      const normalized = normalizePhone(phoneNumber, country);

      if (!normalized) {
        return {
          error: NextResponse.json(
            {
              error: `Enter a valid phone number for ${phoneCountry(country).name}.`,
              code: "INVALID_PHONE_NUMBER",
              field: "phoneNumber",
            },
            { status: 400 },
          ),
        };
      }

      updateData.phoneNumber = normalized;
    }
  }

  if (intraStateDelivery !== undefined) {
    if (intraStateDelivery === null) {
      updateData.intraStateDeliveryMinMinutes = null;
      updateData.intraStateDeliveryMaxMinutes = null;
    } else {
      const minutes = deliveryToMinutes(intraStateDelivery);
      updateData.intraStateDeliveryMinMinutes = minutes.minMinutes;
      updateData.intraStateDeliveryMaxMinutes = minutes.maxMinutes;
    }
  }

  if (interStateDelivery !== undefined) {
    if (interStateDelivery === null) {
      updateData.interStateDeliveryMinMinutes = null;
      updateData.interStateDeliveryMaxMinutes = null;
    } else {
      const minutes = deliveryToMinutes(interStateDelivery);
      updateData.interStateDeliveryMinMinutes = minutes.minMinutes;
      updateData.interStateDeliveryMaxMinutes = minutes.maxMinutes;
    }
  }

  const merged = { ...existing, ...updateData } as Parameters<
    typeof isSellerProfileComplete
  >[0];

  if (isSellerProfileComplete(merged) && !existing?.onboardingCompletedAt) {
    updateData.onboardingCompletedAt = new Date();
  }

  const profile = await prisma.sellerProfile.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData,
      businessName: updateData.businessName as string,
    },
  });

  return {
    profile,
    body: {
      profile: serializeSellerProfile(profile),
      complete: Boolean(profile.onboardingCompletedAt),
    },
  };
}

export async function GET() {
  try {
    const userId = await requireVerifiedUser();
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      profile: profile ? serializeSellerProfile(profile) : null,
      complete: Boolean(profile?.onboardingCompletedAt),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("Get seller profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function ensureSellerRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (user && !user.roles.includes("SELLER")) {
    await prisma.user.update({
      where: { id: userId },
      data: { roles: { set: [...user.roles, "SELLER"] } },
    });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireVerifiedUser();
    const data = createProfileSchema.parse(await req.json());
    const result = await applyProfileUpdate(userId, data);

    if ("error" in result && result.error) return result.error;

    await ensureSellerRole(userId);
    return NextResponse.json(result.body, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return validationResponse(error);
    }
    console.error("Create seller profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await requireVerifiedUser();
    const data = profileFieldsSchema.parse(await req.json());
    const result = await applyProfileUpdate(userId, data);

    if ("error" in result && result.error) return result.error;

    await ensureSellerRole(userId);
    return NextResponse.json(result.body);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return validationResponse(error);
    }
    console.error("Update seller profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
