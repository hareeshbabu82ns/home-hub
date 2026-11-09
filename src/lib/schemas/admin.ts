import { z } from "zod";

export const registrationPolicySchema = z.object({
  type: z.enum(["DOMAIN", "EMAIL"]),
  value: z.string().min(1),
  isAllowed: z.boolean(),
});
