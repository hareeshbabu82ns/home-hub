import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

/**
 * RFC 6238 TOTP (SHA-1, 6 digits, 30 s), the defaults every authenticator
 * app (Google Authenticator, 1Password, Authy, iOS Passwords…) supports.
 */

const PERIOD_SECONDS = 30;
const DIGITS = 6;
/** Accept the previous and next step too, for clock drift. */
const WINDOW = 1;

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error("Invalid base32 secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** 160-bit random secret, base32 (what authenticator apps expect). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function currentStep(now = Date.now()): number {
  return Math.floor(now / 1000 / PERIOD_SECONDS);
}

export function generateTotp(secret: string, step = currentStep()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32Decode(secret))
    .update(counter)
    .digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/**
 * Returns the matching time step, or null. Callers store the step and reject
 * any step at or before it, so an observed code can't be replayed.
 */
export function verifyTotp(
  secret: string,
  code: string,
  lastUsedStep?: number | null,
  now = Date.now(),
): number | null {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return null;
  const step = currentStep(now);
  for (let offset = -WINDOW; offset <= WINDOW; offset++) {
    const candidate = step + offset;
    if (lastUsedStep != null && candidate <= lastUsedStep) continue;
    const expected = Buffer.from(generateTotp(secret, candidate));
    if (timingSafeEqual(expected, Buffer.from(normalized))) return candidate;
  }
  return null;
}

export function totpUri(
  secret: string,
  accountName: string,
  issuer = "Home Hub",
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ------------------------------------------------------------ recovery codes

const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o, 1/l/i

/** Ten single-use codes like "k7mp-2xq9". Only their hashes are stored. */
export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const chars = Array.from(
      { length: 8 },
      () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)],
    ).join("");
    return `${chars.slice(0, 4)}-${chars.slice(4)}`;
  });
}

export function normalizeRecoveryCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256")
    .update(`home-hub-recovery:${normalizeRecoveryCode(code)}`)
    .digest("hex");
}
