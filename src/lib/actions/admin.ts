"use server";

import { userService, registrationPolicyService } from "@/lib/services";
import { getUserAuth, checkAdminAuth } from "@/lib/auth/utils";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { resend } from "@/lib/email";

export const registrationPolicySchema = z.object({
  type: z.enum(["DOMAIN", "EMAIL"]),
  value: z.string().min(1),
  isAllowed: z.boolean(),
});

/**
 * Controller: Get all registration policies
 * Handles authorization and request/response mapping
 */
export async function getRegistrationPolicies() {
  try {
    await checkAdminAuth();
    const policies = await registrationPolicyService.getAll();
    return { success: true, policies };
  } catch (_error) {
    return { error: "Unauthorized" };
  }
}

/**
 * Controller: Add registration policy
 * Handles validation, authorization, and delegates to service layer
 */
export async function addRegistrationPolicy(
  values: z.infer<typeof registrationPolicySchema>,
) {
  try {
    await checkAdminAuth();

    const parsed = registrationPolicySchema.parse(values);

    const policy = await registrationPolicyService.create({
      type: parsed.type,
      value: parsed.value,
      isAllowed: parsed.isAllowed,
    });

    return { success: true, policy };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    if (error instanceof Error && error.message === "Policy already exists") {
      return { error: "Policy already exists" };
    }
    return { error: "Failed to add policy" };
  }
}

/**
 * Controller: Update registration policy
 */
export async function updateRegistrationPolicy(
  id: string,
  values: z.infer<typeof registrationPolicySchema>,
) {
  try {
    await checkAdminAuth();

    const parsed = registrationPolicySchema.parse(values);

    const policy = await registrationPolicyService.update(id, {
      type: parsed.type,
      value: parsed.value,
      isAllowed: parsed.isAllowed,
    });

    return { success: true, policy };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation failed" };
    }
    return { error: "Failed to update policy" };
  }
}

/**
 * Controller: Delete registration policy
 */
export async function deleteRegistrationPolicy(id: string) {
  try {
    await checkAdminAuth();
    await registrationPolicyService.delete(id);
    return { success: true };
  } catch (_error) {
    return { error: "Failed to delete policy" };
  }
}

/**
 * Controller: Get all users
 */
export async function getAllUsers() {
  try {
    await checkAdminAuth();
    const users = await userService.getAll();
    return { success: true, users };
  } catch (_error) {
    return { error: "Unauthorized" };
  }
}

/**
 * Controller: Update user
 */
export async function updateUser(
  userId: string,
  updates: { name?: string; role?: "USER" | "ADMIN"; isActive?: boolean },
) {
  try {
    await checkAdminAuth();

    const user = await userService.update(userId, updates);

    return { success: true, user };
  } catch (_error) {
    return { error: "Failed to update user" };
  }
}

/**
 * Controller: Reset user password
 * Triggers password reset email
 */
export async function resetUserPassword(userId: string) {
  try {
    await checkAdminAuth();

    const user = await userService.getById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    // Create reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // TODO: Create password reset in database
    // await db.passwordReset.create({...})

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

/**
 * Controller: Delete user
 */
export async function deleteUser(userId: string) {
  try {
    await checkAdminAuth();

    // Prevent deleting self
    const { session } = await getUserAuth();
    if (session?.user.id === userId) {
      return { error: "Cannot delete your own account" };
    }

    await userService.delete(userId);

    return { success: true };
  } catch (_error) {
    return { error: "Failed to delete user" };
  }
}

/**
 * Controller: Make user admin
 */
export async function makeAdmin(userId: string) {
  try {
    await checkAdminAuth();
    await userService.makeAdmin(userId);
    return { success: true };
  } catch (_error) {
    return { error: "Failed to make user admin" };
  }
}

/**
 * Controller: Remove admin privileges
 */
export async function removeAdmin(userId: string) {
  try {
    await checkAdminAuth();

    // Prevent removing own admin status if it's the only admin
    const { session } = await getUserAuth();
    if (session?.user.id === userId) {
      const adminCount = await userService.countByRole("ADMIN");

      if (adminCount === 1) {
        return { error: "Cannot remove admin status from the only admin" };
      }
    }

    await userService.removeAdmin(userId);

    return { success: true };
  } catch (_error) {
    return { error: "Failed to remove admin status" };
  }
}

/**
 * Controller: Toggle user active status
 */
export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    await checkAdminAuth();

    // Prevent deactivating self
    const { session } = await getUserAuth();
    if (session?.user.id === userId) {
      return { error: "Cannot change your own status" };
    }

    await userService.toggleStatus(userId, isActive);
  } catch (_error) {
    return { error: "Failed to update user status" };
  }
}
