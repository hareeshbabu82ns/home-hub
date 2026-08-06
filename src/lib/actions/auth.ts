"use server";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";
import {
  passwordResetSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas";
import { checkAuth, getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db/index";
import { resend } from "@/lib/email";
import { env } from "@/lib/env.mjs";
import { userService } from "@/lib/services";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * Controller: Sign up user
 * Handles validation, authorization checks, and delegates to service
 */
export async function signUp( values: z.infer<typeof signUpSchema> ) {
  try {
    const parsed = signUpSchema.parse( values );

    // Check if email already exists
    const existingUser = await userService.getByEmail( parsed.email );

    if ( existingUser ) {
      return { error: "Email already registered" };
    }

    // Check if email is in admin emails list
    const adminEmails =
      env.ADMIN_EMAILS?.split( "," )
        .map( ( email ) => email.trim() )
        .filter( ( email ) => email.length > 0 ) || [];
    const isAdmin = adminEmails.includes( parsed.email );

    // Create user
    const user = await userService.create( {
      email: parsed.email,
      name: parsed.name,
      password: parsed.password,
      role: isAdmin ? "ADMIN" : "USER",
    } );

    // Sign in user
    await nextAuthSignIn( "credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    } );

    return { success: true, userId: user.id };
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      return { error: error.issues[ 0 ]?.message || "Validation failed" };
    }
    return { error: "An error occurred during sign up" };
  }
}

/**
 * Controller: Sign in user
 */
export async function signIn( values: z.infer<typeof signInSchema> ) {
  try {
    const parsed = signInSchema.parse( values );

    const user = await userService.getByEmail( parsed.email );

    if ( !user || !user.password ) {
      return { error: "Invalid email or password" };
    }

    const passwordsMatch = await userService.verifyPassword(
      parsed.password,
      user.password,
    );

    if ( !passwordsMatch ) {
      return { error: "Invalid email or password" };
    }

    if ( !user.isActive ) {
      return { error: "This account is inactive" };
    }

    await nextAuthSignIn( "credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    } );

    return { success: true };
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      return { error: error.issues[ 0 ]?.message || "Validation failed" };
    }
    return { error: "An error occurred during sign in" };
  }
}

/**
 * Controller: Sign out user
 */
export async function signOut() {
  await nextAuthSignOut( { redirect: false } );
  redirect( "/sign-in" );
}

/**
 * Controller: Request password reset
 */
export async function requestPasswordReset( email: string ) {
  try {
    const user = await userService.getByEmail( email );

    if ( !user ) {
      // Don't reveal if email exists for security
      return { success: true };
    }

    // Delete old reset tokens
    await db.passwordReset.deleteMany( {
      where: { userId: user.id },
    } );

    // Create new reset token
    const token = randomBytes( 32 ).toString( "hex" );
    const expiresAt = new Date( Date.now() + 24 * 60 * 60 * 1000 ); // 24 hours

    await db.passwordReset.create( {
      data: {
        userId: user.id,
        token,
        expires: expiresAt,
      },
    } );

    // Send email with reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    if ( resend ) {
      await resend.emails.send( {
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
      } );
    }

    return { success: true };
  } catch ( _error ) {
    console.error( "Password reset error:", _error );
    return { error: "An error occurred" };
  }
}

/**
 * Controller: Reset password
 */
export async function resetPassword(
  token: string,
  values: z.infer<typeof passwordResetSchema>,
) {
  try {
    const parsed = passwordResetSchema.parse( values );

    const resetToken = await db.passwordReset.findUnique( {
      where: { token },
      include: { user: true },
    } );

    if ( !resetToken || resetToken.expires < new Date() ) {
      return { error: "Invalid or expired reset token" };
    }

    // Update password
    await userService.changePassword( resetToken.userId, parsed.password );

    // Delete reset token
    await db.passwordReset.delete( {
      where: { id: resetToken.id },
    } );

    return { success: true };
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      return { error: error.issues[ 0 ]?.message || "Validation failed" };
    }
    return { error: "An error occurred" };
  }
}

/**
 * Controller: Update user profile
 */
export async function updateUserProfile( name: string, image?: string ) {
  try {
    await checkAuth();
    const { session } = await getUserAuth();

    if ( !session ) {
      return { error: "Unauthorized" };
    }

    const user = await userService.update( session.user.id, {
      name,
      ...( image && { image } ),
    } );

    return { success: true, user };
  } catch ( _error ) {
    return { error: "Failed to update profile" };
  }
}

/**
 * Controller: Change password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  try {
    if ( newPassword !== confirmPassword ) {
      return { error: "Passwords don't match" };
    }

    if ( newPassword.length < 8 ) {
      return { error: "Password must be at least 8 characters" };
    }

    await checkAuth();
    const { session } = await getUserAuth();

    if ( !session ) {
      return { error: "Unauthorized" };
    }

    const user = await userService.getById( session.user.id );

    if ( !user?.password ) {
      return { error: "User account not properly configured" };
    }

    const passwordMatch = await userService.verifyPassword(
      currentPassword,
      user.password,
    );
    if ( !passwordMatch ) {
      return { error: "Current password is incorrect" };
    }

    await userService.changePassword( session.user.id, newPassword );

    return { success: true };
  } catch ( _error ) {
    return { error: "Failed to change password" };
  }
}
