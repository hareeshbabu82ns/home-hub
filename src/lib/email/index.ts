import { Resend } from "resend";
import { env } from "@/lib/env.mjs";

export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;
