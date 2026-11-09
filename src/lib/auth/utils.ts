import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
    };
  } | null;
};

export const getUserAuth = async (): Promise<AuthSession> => {
  // Check if BYPASS_AUTH is enabled for development
  const { BYPASS_AUTH } = await import("@/lib/env.mjs").then((m) => m.env);

  if (BYPASS_AUTH === "true") {
    return {
      session: {
        user: {
          name: "Hareesh",
          email: "hareeshbabu82ns@gmail.com",
          image: "https://avatars.githubusercontent.com/u/1978258?v=4",
          id: "687aafec250a439b85417a3d",
          role: "ADMIN",
        },
      },
    };
  }

  const session = await auth();
  // Half-signed-in (2FA pending) sessions get no access anywhere.
  return {
    session: session && !session.user.mfaPending
      ? {
          user: {
            id: session.user.id,
            name: session.user.name || undefined,
            email: session.user.email || undefined,
            image: session.user.image || undefined,
            role: session.user.role || undefined,
          },
        }
      : null,
  };
};

/** The signed-in user still owing a second factor, or null. */
export const getPendingMfaUser = async () => {
  const session = await auth();
  if (!session?.user?.mfaPending) return null;
  return { id: session.user.id, email: session.user.email ?? null, name: session.user.name ?? null };
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (session) return;
  redirect((await getPendingMfaUser()) ? "/verify-mfa" : "/sign-in");
};

export const checkAdminAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) {
    await checkAuth();
  }
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
};
