"use server";

import { db } from "@/lib/db/index";
import { getUserAuth, checkAdminAuth } from "@/lib/auth/utils";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { resend } from "@/lib/email";

export const registrationPolicySchema = z.object({
  type: z.enum(["DOMAIN", "EMAIL"]),
  value: z.string().min(1),
  isAllowed: z.boolean(),
});

export async function getRegistrationPolicies() {
  try {
    await checkAdminAuth();

    const policies = await db.registrationPolicy.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, policies };
  } catch (_error) {
    return { error: "Unauthorized" };
  }
}

export async function addRegistrationPolicy(
  values: z.infer<typeof registrationPolicySchema>,
) {
  try {
    await checkAdminAuth();

    const parsed = registrationPolicySchema.parse(values);

    // Check if policy already exists
    const existing = await db.registrationPolicy.findUnique({
      where: {
        type_value: { type: parsed.type, value: parsed.value },
      },
    });

    if (existing) {
      return { error: "Policy already exists" };
    }

    const policy = await db.registrationPolicy.create({
      data: {
        type: parsed.type,
        value: parsed.value,
        isAllowed: parsed.isAllowed,
      },
    });

    return { success: true, policy };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    return { error: "Failed to add policy" };
  }
}

export async function updateRegistrationPolicy(
  id: string,
  values: z.infer<typeof registrationPolicySchema>,
) {
  try {
    await checkAdminAuth();

    const parsed = registrationPolicySchema.parse(values);

    const policy = await db.registrationPolicy.update({
      where: { id },
      data: {
        type: parsed.type,
        value: parsed.value,
        isAllowed: parsed.isAllowed,
      },
    });

    return { success: true, policy };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    return { error: "Failed to update policy" };
  }
}

export async function deleteRegistrationPolicy(id: string) {
  try {
    await checkAdminAuth();

    await db.registrationPolicy.delete({
      where: { id },
    });

    return { success: true };
  } catch (_error) {
    return { error: "Failed to delete policy" };
  }
}

export async function getAllUsers() {
  try {
    await checkAdminAuth();

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, users };
  } catch (_error) {
    return { error: "Unauthorized" };
  }
}

export async function updateUser(
  userId: string,
  updates: { name?: string; role?: "USER" | "ADMIN"; isActive?: boolean },
) {
  try {
    await checkAdminAuth();

    const user = await db.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return { success: true, user };
  } catch (_error) {
    return { error: "Failed to update user" };
  }
}

export async function resetUserPassword(userId: string) {
  try {
    await checkAdminAuth();

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Delete old reset tokens
    await db.passwordReset.deleteMany({
      where: { userId },
    });

    // Create new reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.passwordReset.create({
      data: {
        userId,
        token,
        expires: expiresAt,
      },
    });

    // Send email with reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    if (resend && user.email) {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Password reset request from admin",
        html: `
          <h1>Password Reset Request</h1>
          <p>An administrator has requested a password reset for your account.</p>
          <p>Click the link below to set a new password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link expires in 24 hours.</p>
        `,
      });
    }

    return { success: true };
  } catch (_error) {
    return { error: "Failed to reset password" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await checkAdminAuth();

    // Prevent deleting self
    const { session } = await getUserAuth();
    if (session?.user.id === userId) {
      return { error: "Cannot delete your own account" };
    }

    await db.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (_error) {
    return { error: "Failed to delete user" };
  }
}

export async function makeAdmin(userId: string) {
  try {
    await checkAdminAuth();

    await db.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });

    return { success: true };
  } catch (_error) {
    return { error: "Failed to make user admin" };
  }
}

export async function removeAdmin(userId: string) {
  try {
    await checkAdminAuth();

    // Prevent removing own admin status if it's the only admin
    const { session } = await getUserAuth();
    if (session?.user.id === userId) {
      const adminCount = await db.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount === 1) {
        return { error: "Cannot remove admin status from the only admin" };
      }
    }

    await db.user.update({
      where: { id: userId },
      data: { role: "USER" },
    });

    return { success: true };
  } catch (_error) {
    return { error: "Failed to remove admin status" };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    await checkAdminAuth();

    // Prevent deactivating self
    const { session } = await getUserAuth();
    if (session?.user.id === userId) {
      return { error: "Cannot change your own status" };
    }

    await db.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return { success: true };
  } catch (_error) {
    return { error: "Failed to update user status" };
  }
}
