"use server";

import QRCode from "qrcode";
import type { Session } from "next-auth";
import { z } from "zod";

import { signOut as nextAuthSignOut, unstable_update } from "@/auth";
import {
  cancelEnrollment,
  confirmEnrollment,
  createMfaProof,
  disableMfa,
  getMfaStatus,
  MfaError,
  regenerateRecoveryCodes,
  startEnrollment,
  verifyMfaCode,
} from "@/lib/auth/mfa/service";
import { getPendingMfaUser, getUserAuth } from "@/lib/auth/utils";

/** Two-factor authentication: sign-in step and self-service management. */

const codeSchema = z.string().trim().min(6, "Enter the 6-digit code").max(20);

function fail(error: unknown, fallback: string) {
  if (error instanceof MfaError)
    return { success: false as const, error: error.message };
  if (error instanceof z.ZodError)
    return {
      success: false as const,
      error: error.issues[0]?.message ?? fallback,
    };
  console.error(fallback, error);
  return { success: false as const, error: fallback };
}

async function requireUser() {
  const { session } = await getUserAuth();
  if (!session) throw new MfaError("Sign in again to continue");
  return session.user;
}

// ------------------------------------------------------------ sign-in step

/** Second step of sign-in: authenticator or recovery code. */
export async function verifyMfaSignIn(code: string) {
  try {
    const pending = await getPendingMfaUser();
    if (!pending)
      return {
        success: false as const,
        error: "Your sign-in expired. Sign in again.",
      };
    const result = await verifyMfaCode(pending.id, codeSchema.parse(code));
    await unstable_update({
      mfaProof: createMfaProof(pending.id),
    } as unknown as Partial<Session>);
    return { success: true as const, ...result };
  } catch (error) {
    return fail(error, "Couldn't verify the code");
  }
}

/** "Use a different account" on the verify page. */
export async function cancelMfaSignIn() {
  await nextAuthSignOut({ redirect: false });
  return { success: true as const };
}

// ------------------------------------------------------------- management

export async function getMyMfaStatus() {
  try {
    const user = await requireUser();
    return { success: true as const, data: await getMfaStatus(user.id) };
  } catch (error) {
    return fail(error, "Couldn't load two-factor status");
  }
}

/** Starts enrolment: secret + QR code for the authenticator app. */
export async function beginMfaSetup() {
  try {
    const user = await requireUser();
    const status = await getMfaStatus(user.id);
    if (status.enabled)
      return {
        success: false as const,
        error: "Two-factor authentication is already on",
      };
    const { secret, uri } = await startEnrollment(
      user.id,
      user.email ?? user.name ?? user.id,
    );
    const qrSvg = await QRCode.toString(uri, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return {
      success: true as const,
      data: {
        // Grouped in fours for typing into an app by hand.
        secret: secret.match(/.{1,4}/g)?.join(" ") ?? secret,
        uri,
        qrDataUrl: `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`,
      },
    };
  } catch (error) {
    return fail(error, "Couldn't start two-factor setup");
  }
}

/** Finishes enrolment with the first code; returns the recovery codes (shown once). */
export async function confirmMfaSetup(code: string) {
  try {
    const user = await requireUser();
    const recoveryCodes = await confirmEnrollment(
      user.id,
      codeSchema.parse(code),
    );
    return { success: true as const, recoveryCodes };
  } catch (error) {
    return fail(error, "Couldn't turn on two-factor authentication");
  }
}

export async function cancelMfaSetup() {
  try {
    const user = await requireUser();
    await cancelEnrollment(user.id);
    return { success: true as const };
  } catch (error) {
    return fail(error, "Couldn't cancel setup");
  }
}

/** Needs a current code (or a recovery code) so a borrowed session can't turn it off. */
export async function disableMyMfa(code: string) {
  try {
    const user = await requireUser();
    await verifyMfaCode(user.id, codeSchema.parse(code));
    await disableMfa(user.id);
    return { success: true as const };
  } catch (error) {
    return fail(error, "Couldn't turn off two-factor authentication");
  }
}

export async function regenerateMyRecoveryCodes(code: string) {
  try {
    const user = await requireUser();
    await verifyMfaCode(user.id, codeSchema.parse(code));
    return {
      success: true as const,
      recoveryCodes: await regenerateRecoveryCodes(user.id),
    };
  } catch (error) {
    return fail(error, "Couldn't create new recovery codes");
  }
}
