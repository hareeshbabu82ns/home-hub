import { db } from "@/lib/db/index";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { env } from "@/lib/env.mjs";
import { z } from "zod";
import { verifyMfaProof } from "@/lib/auth/mfa/service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      /** Signed in, but the second factor hasn't been entered yet. */
      mfaPending?: boolean;
    };
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const parsedCredentials = credentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsedCredentials.data.email },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await compare(
          parsedCredentials.data.password,
          user.password,
        );
        if (!passwordsMatch) return null;

        if (!user.isActive) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? [
          GithubProvider({
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/auth-error",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, mfaEnabled: true },
        });
        token.role = dbUser?.role || undefined;
        // Every sign-in (password or OAuth) of an account with 2FA starts
        // half-authenticated until /verify-mfa clears this.
        token.mfaPending = !!dbUser?.mfaEnabled;
      }
      if (
        trigger === "update" &&
        token.mfaPending &&
        verifyMfaProof((session as { mfaProof?: unknown } | undefined)?.mfaProof, token.id as string)
      ) {
        token.mfaPending = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
        session.user.mfaPending = token.mfaPending === true;
      }
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      // Admin routes
      if (pathname.startsWith("/admin")) {
        return !!(
          auth?.user && (auth.user as { role?: string }).role === "ADMIN"
        );
      }

      // Protected routes
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/settings")
      ) {
        return !!auth;
      }

      return true;
    },
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
