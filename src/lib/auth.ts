import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const exactOrigins = (values: Array<string | undefined>) =>
  values.filter((value): value is string => Boolean(value)).map((value) => new URL(value).origin);

const developmentOrigins = [
  "http://localhost:3000",
  ...exactOrigins([
    process.env.V0_RUNTIME_URL,
    process.env.V0_DEV_APP_URL,
    process.env.V0_BUILD_URL,
    process.env.V0_SANDBOX_URL,
  ]),
];

const productionOrigins = exactOrigins([
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
]);

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const from = process.env.RESEND_EMAIL_DOMAIN
        ? `VibeBuild <no-reply@${process.env.RESEND_EMAIL_DOMAIN}>`
        : "VibeBuild <onboarding@resend.dev>";
      const { error } = await resend.emails.send(
        {
          from,
          to: [user.email],
          subject: "Reset your VibeBuild password",
          html: `<p>We received a request to reset your VibeBuild password.</p><p><a href="${url}">Reset your password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
          text: `Reset your VibeBuild password: ${url}`,
        },
        { idempotencyKey: `password-reset/${user.id}` },
      );
      if (error) console.error("[v0] Password reset email failed:", error.message);
    },
  },
  trustedOrigins: process.env.NODE_ENV === "development" ? developmentOrigins : productionOrigins,
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: { sameSite: "none" as const, secure: true },
        },
      }
    : {}),
});
