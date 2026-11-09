import {
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";

import {
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  totpUri,
  verifyTotp,
} from "./totp";

/** Wrong codes in a row before the account's second step locks for a while. */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;
const PROOF_TTL_MS = 60_000;

export class MfaError extends Error {}

export type MfaMethod = "totp" | "recovery";

export interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
  enrolling: boolean;
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
      mfaEnabledAt: true,
      mfaRecoveryCodes: true,
      mfaPendingSecret: true,
    },
  });
  return {
    enabled: !!user?.mfaEnabled,
    enabledAt: user?.mfaEnabledAt?.toISOString() ?? null,
    recoveryCodesLeft: user?.mfaRecoveryCodes?.length ?? 0,
    enrolling: !!user?.mfaPendingSecret,
  };
}

export async function isMfaEnabled(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });
  return !!user?.mfaEnabled;
}

/** Step 1 of enrolment: a new secret (kept pending until confirmed). */
export async function startEnrollment(userId: string, accountName: string) {
  const secret = generateTotpSecret();
  await db.user.update({
    where: { id: userId },
    data: { mfaPendingSecret: encryptSecret(secret) },
  });
  return { secret, uri: totpUri(secret, accountName) };
}

/** Step 2: the first code proves the app is set up; returns recovery codes once. */
export async function confirmEnrollment(
  userId: string,
  code: string,
): Promise<string[]> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.mfaPendingSecret)
    throw new MfaError("Start setup again: the setup session expired");
  const secret = decryptSecret(user.mfaPendingSecret);
  const step = verifyTotp(secret, code);
  if (step === null)
    throw new MfaError(
      "That code didn't match. Check the time on your phone and try the newest code.",
    );

  const recoveryCodes = generateRecoveryCodes();
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: user.mfaPendingSecret,
      mfaPendingSecret: null,
      mfaRecoveryCodes: recoveryCodes.map(hashRecoveryCode),
      mfaLastStep: step,
      mfaEnabledAt: new Date(),
      mfaFailedAttempts: 0,
      mfaLockedUntil: null,
    },
  });
  return recoveryCodes;
}

export async function cancelEnrollment(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { mfaPendingSecret: null },
  });
}

export async function disableMfa(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaPendingSecret: null,
      mfaRecoveryCodes: [],
      mfaLastStep: null,
      mfaEnabledAt: null,
      mfaFailedAttempts: 0,
      mfaLockedUntil: null,
    },
  });
}

export async function regenerateRecoveryCodes(
  userId: string,
): Promise<string[]> {
  const codes = generateRecoveryCodes();
  await db.user.update({
    where: { id: userId },
    data: { mfaRecoveryCodes: codes.map(hashRecoveryCode) },
  });
  return codes;
}

/**
 * Checks an authenticator code or a recovery code (used up on success).
 * Repeated failures lock the second step for 15 minutes.
 */
export async function verifyMfaCode(
  userId: string,
  input: string,
): Promise<{ method: MfaMethod; recoveryCodesLeft: number }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.mfaEnabled || !user.mfaSecret)
    throw new MfaError("Two-factor authentication isn't enabled");

  if (user.mfaLockedUntil && user.mfaLockedUntil > new Date()) {
    const minutes = Math.ceil(
      (user.mfaLockedUntil.getTime() - Date.now()) / 60_000,
    );
    throw new MfaError(
      `Too many wrong codes. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }

  const code = input.trim();
  const codes = user.mfaRecoveryCodes ?? [];

  if (/^\d{3}\s?\d{3}$/.test(code)) {
    const step = verifyTotp(
      decryptSecret(user.mfaSecret),
      code,
      user.mfaLastStep,
    );
    if (step !== null) {
      await db.user.update({
        where: { id: userId },
        data: { mfaLastStep: step, mfaFailedAttempts: 0, mfaLockedUntil: null },
      });
      return { method: "totp", recoveryCodesLeft: codes.length };
    }
  } else {
    const hash = hashRecoveryCode(code);
    if (codes.includes(hash)) {
      const remaining = codes.filter((stored) => stored !== hash);
      await db.user.update({
        where: { id: userId },
        data: {
          mfaRecoveryCodes: remaining,
          mfaFailedAttempts: 0,
          mfaLockedUntil: null,
        },
      });
      return { method: "recovery", recoveryCodesLeft: remaining.length };
    }
  }

  const failed = (user.mfaFailedAttempts ?? 0) + 1;
  const locked = failed >= MAX_FAILED_ATTEMPTS;
  await db.user.update({
    where: { id: userId },
    data: {
      mfaFailedAttempts: locked ? 0 : failed,
      mfaLockedUntil: locked ? new Date(Date.now() + LOCK_MS) : null,
    },
  });
  throw new MfaError(
    locked
      ? "Too many wrong codes. Try again in 15 minutes."
      : "That code didn't work. Use the current code from your authenticator app, or a recovery code.",
  );
}

// -------------------------------------------------------------- session proof
//
// After a successful second step the server action calls `unstable_update`
// with a short-lived proof; the jwt callback only clears `mfaPending` when the
// proof's signature and user match. The browser can call the session update
// endpoint too, but can't produce a valid proof.

function proofKey(): Buffer {
  const material = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
  if (material.length < 16) throw new Error("NEXTAUTH_SECRET must be set");
  return Buffer.from(
    hkdfSync("sha256", material, "home-hub", "mfa-proof:v1", 32),
  );
}

function sign(payload: string) {
  return createHmac("sha256", proofKey()).update(payload).digest("base64url");
}

export function createMfaProof(userId: string): string {
  const payload = `${userId}.${Date.now() + PROOF_TTL_MS}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyMfaProof(proof: unknown, userId: string): boolean {
  if (typeof proof !== "string") return false;
  const parts = proof.split(".");
  if (parts.length !== 4) return false;
  const [subject, expires, nonce, signature] = parts as [
    string,
    string,
    string,
    string,
  ];
  if (subject !== userId || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(`${subject}.${expires}.${nonce}`));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
