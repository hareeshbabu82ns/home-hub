"use server";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";
import { db } from "@/lib/db/index";
import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { resend } from "@/lib/email";
import { getUserAuth, checkAuth } from "@/lib/auth/utils";
import { env } from "@/lib/env.mjs";
import {
  signUpSchema,
  signInSchema,
  passwordResetSchema,
} from "@/lib/auth/schemas";

export async function signUp(values: z.infer<typeof signUpSchema>) {
  try {
    const parsed = signUpSchema.parse(values);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: parsed.email },
    });

    if (existingUser) {
      return { error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await hash(parsed.password, 10);

    // Check if email is in admin emails list
    const adminEmails =
      env.ADMIN_EMAILS?.split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0) || [];
    const isAdmin = adminEmails.includes(parsed.email);

    // Create user
    const user = await db.user.create({
      data: {
        email: parsed.email,
        name: parsed.name,
        password: hashedPassword,
        role: isAdmin ? "ADMIN" : "USER",
      },
    });

    // Sign in user
    await nextAuthSignIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    });

    return { success: true, userId: user.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    return { error: "An error occurred during sign up" };
  }
}

export async function signIn(values: z.infer<typeof signInSchema>) {
  try {
    const parsed = signInSchema.parse(values);

    const result = await nextAuthSignIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    });

    if (!result || !result.ok) {
      return { error: "Invalid email or password" };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    return { error: "An error occurred during sign in" };
  }
}

export async function signOut() {
  await nextAuthSignOut({ redirect: false });
  redirect("/sign-in");
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { success: true };
    }

    // Delete old reset tokens
    await db.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expires: expiresAt,
      },
    });

    // Send email with reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Reset your password",
        html: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    }

    return { success: true };
  } catch (_error) {
    console.error("Password reset error:", _error);
    return { error: "An error occurred" };
  }
}

export async function resetPassword(
  token: string,
  values: z.infer<typeof passwordResetSchema>,
) {
  try {
    const parsed = passwordResetSchema.parse(values);

    const resetToken = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return { error: "Invalid or expired reset token" };
    }

    // Update password
    const hashedPassword = await hash(parsed.password, 10);
    await db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete reset token
    await db.passwordReset.delete({
      where: { id: resetToken.id },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    return { error: "An error occurred" };
  }
}

export async function updateUserProfile(name: string, image?: string) {
  try {
    await checkAuth();
    const { session } = await getUserAuth();

    if (!session) {
      return { error: "Unauthorized" };
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        ...(image && { image }),
      },
    });

    return { success: true, user };
  } catch (_error) {
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  try {
    if (newPassword !== confirmPassword) {
      return { error: "Passwords don't match" };
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    await checkAuth();
    const { session } = await getUserAuth();

    if (!session) {
      return { error: "Unauthorized" };
    }

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user.password) {
      return { error: "User account not properly configured" };
    }

    const passwordMatch = await compare(currentPassword, user.password);
    if (!passwordMatch) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await hash(newPassword, 10);
    await db.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (_error) {
    return { error: "Failed to change password" };
  }
}
