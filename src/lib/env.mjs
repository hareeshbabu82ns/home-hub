import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),

    APPWRITE_HOST:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    APPWRITE_API_KEY:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    APPWRITE_PROJECT_ID:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    APPWRITE_DATABASE_ID:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    APPWRITE_BUCKET_ID:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    APPWRITE_SESSION_COOKIE_KEY:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),

    NEXTAUTH_SECRET:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : process.env.NODE_ENV === "production"
          ? z.string().min(1)
          : z.string().min(1).optional(),
    NEXTAUTH_URL:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.preprocess(
            // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
            // Since NextAuth.js automatically uses the VERCEL_URL if present.
            (str) => process.env.VERCEL_URL ?? str,
            // VERCEL_URL doesn't include `https` so it cant be validated as a URL
            process.env.VERCEL_URL ? z.string().min(1) : z.string().url(),
          ),
    GOOGLE_CLIENT_ID:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    GOOGLE_CLIENT_SECRET:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    GITHUB_CLIENT_ID:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    GITHUB_CLIENT_SECRET:
      process.env.SKIP_ENV_VALIDATION === "true"
        ? z.string().optional()
        : z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
  },
  client: {
    // NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  // runtimeEnv: {
  //   DATABASE_URL: process.env.DATABASE_URL,
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    // NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  },
});
