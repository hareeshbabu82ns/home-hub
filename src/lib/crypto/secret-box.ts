import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

/**
 * AES-256-GCM encryption for credentials stored in the database (router API
 * secrets). Format: `enc:v1:<iv>:<tag>:<ciphertext>`, each part base64url.
 *
 * Key material comes from NETWORK_SECRET_KEY, falling back to NEXTAUTH_SECRET
 * so existing installs work without new config. Rotating that value makes
 * stored secrets undecryptable; they then have to be re-entered in Settings.
 */

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const material =
    process.env.NETWORK_SECRET_KEY || process.env.NEXTAUTH_SECRET || "";
  if (material.length < 16) {
    throw new Error(
      "NETWORK_SECRET_KEY (or NEXTAUTH_SECRET) must be set to store router credentials",
    );
  }
  return Buffer.from(
    hkdfSync("sha256", material, "home-hub", "network-credentials:v1", 32),
  );
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

/** Decrypts an `enc:v1:` value; legacy plaintext values pass through unchanged. */
export function decryptSecret(stored: string): string {
  if (!isEncryptedSecret(stored)) return stored;

  const [iv, tag, ciphertext] = stored.slice(PREFIX.length).split(":");
  if (!iv || !tag || ciphertext === undefined) {
    throw new Error("Malformed encrypted secret");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error(
      "Stored router secret can't be decrypted (was NETWORK_SECRET_KEY changed?). Re-enter it in Settings → Network.",
    );
  }
}
