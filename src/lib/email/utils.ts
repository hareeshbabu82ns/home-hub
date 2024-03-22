import { z } from "zod";
const test = 1;
export const emailWelcomeSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});
