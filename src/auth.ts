import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth(authConfig);
