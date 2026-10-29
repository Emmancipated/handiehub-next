type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendOtpParams = {
  toEmail: string;
  firstName: string;
  otp: string;
  expiresInMinutes: number;
};

type SendPasswordResetOtpParams = {
  toEmail: string;
  firstName: string;
  otp: string;
  expiresInMinutes: number;
};

const from =
  process.env.MAIL_SENDER_DEFAULT || "HandieHub <onboarding@resend.dev>";

async function resendSend(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured; skipping send");
    return false;
  }

  // Lazy import so the module loads even when the `resend` package is absent
  // (e.g. in Jest's CommonJS resolver, which can't resolve the package's
  // ESM `.mjs` entry). At runtime in Node/Next the dynamic import resolves.
  let ResendCtor: new (apiKey: string) => {
    emails: {
      send: (params: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text: string;
      }) => Promise<{ error?: unknown }>;
    };
  };
  try {
    const mod = (await import("resend" /* @vite-ignore */)) as unknown as {
      Resend?: typeof ResendCtor;
      default?: typeof ResendCtor;
    };
    ResendCtor = (mod.Resend ?? mod.default) as typeof ResendCtor;
  } catch (err) {
    console.error("[email] Failed to load resend package:", err);
    return false;
  }

  const resend = new ResendCtor(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    console.log("[email] Sent email to", params.to, "subject:", params.subject);
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  return resendSend(params);
}

export async function sendOtpEmail(params: SendOtpParams): Promise<boolean> {
  return sendEmail({
    to: params.toEmail,
    subject: "Your HandieHub verification code",
    html: `
      <p>Hi ${params.firstName},</p>
      <p>Your verification code is <strong style="font-size:24px;">${params.otp}</strong>.</p>
      <p>This code will expire in ${params.expiresInMinutes} minutes.</p>
      <p>Regards,<br/>HandieHub</p>
    `,
    text: `Hi ${params.firstName},\n\nYour verification code is ${params.otp}.\nThis code will expire in ${params.expiresInMinutes} minutes.\n\nRegards,\nHandieHub`,
  });
}

export async function sendPasswordResetOtpEmail(
  params: SendPasswordResetOtpParams,
): Promise<boolean> {
  return sendEmail({
    to: params.toEmail,
    subject: "HandieHub password reset code",
    html: `
      <p>Hi ${params.firstName},</p>
      <p>Your password reset code is <strong style="font-size:24px;">${params.otp}</strong>.</p>
      <p>This code expires in ${params.expiresInMinutes} minutes.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
      <p>Regards,<br/>HandieHub</p>
    `,
    text: `Hi ${params.firstName},\n\nYour password reset code is ${params.otp}.\nThis code expires in ${params.expiresInMinutes} minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nRegards,\nHandieHub`,
  });
}
