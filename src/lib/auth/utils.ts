import { db } from "@/lib/db/index";
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  type DefaultSession,
  type NextAuthOptions,
  getServerSession,
} from "next-auth";
import { redirect } from "next/navigation";
import { env } from "@/lib/env.mjs";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import type { Adapter } from "next-auth/adapters";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    };
  } | null;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  callbacks: {
    session: ({ session, user }) => {
      session.user.id = user.id;
      return session;
    },
  },
  providers: [
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
};

export const getUserAuth = async (): Promise<AuthSession> => {
  // Check if BYPASS_AUTH is enabled for development
  if (env.BYPASS_AUTH === "true") {
    return {
      session: {
        user: {
          name: "Hareesh",
          email: "hareeshbabu82ns@gmail.com",
          image: "https://avatars.githubusercontent.com/u/1978258?v=4",
          id: "687aafec250a439b85417a3d",
        },
      },
    };
  }

  const session = await getServerSession(authOptions);
  return {
    session: session
      ? {
          user: {
            id: session.user.id,
            name: session.user.name || undefined,
            email: session.user.email || undefined,
            image: session.user.image || undefined,
          },
        }
      : null,
  };
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect("/api/auth/signin");
};
