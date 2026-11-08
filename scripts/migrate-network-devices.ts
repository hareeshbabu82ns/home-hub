/**
 * Phase 1 network migration (idempotent). Run inside the devcontainer:
 *
 *   pnpm db:migrate:network            # dry run, prints what would change
 *   pnpm db:migrate:network --apply    # writes, then run `pnpm db:push`
 *
 * - Devices become MAC-identified: MACs lower-cased, duplicates reported.
 * - Backfills the new NetworkDevice fields (role, isUpstream, isRandomMac,
 *   isOnline) so Prisma can read old documents.
 * - Clears deviceType "ethernet" (it was ARP's link type, not a user value).
 * - Seeds NetworkDeviceAddress with each device's current IP.
 * - Drops the old unique (userId, ipAddress) index.
 * - Encrypts plaintext router API secrets.
 */
import "dotenv/config";
import { MongoClient, type ObjectId } from "mongodb";

import { encryptSecret, isEncryptedSecret } from "../src/lib/crypto/secret-box";

const apply = process.argv.includes("--apply");

function normaliseMac(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const mac = value.trim().toLowerCase().replace(/-/g, ":");
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac) ? mac : null;
}

function isRandomMac(mac: string): boolean {
  return (parseInt(mac.slice(0, 2), 16) & 0x02) !== 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();
  const devices = db.collection("NetworkDevice");
  const addresses = db.collection("NetworkDeviceAddress");
  const settings = db.collection("NetworkIntegrationSettings");

  console.log(apply ? "Applying migration" : "Dry run (pass --apply to write)");

  const rows = await devices.find({}).toArray();
  const seen = new Map<string, ObjectId>();
  const duplicates: string[] = [];
  const invalid: string[] = [];
  let updated = 0;
  let addressesSeeded = 0;

  for (const row of rows) {
    const mac = normaliseMac(row.macAddress);
    if (!mac) {
      invalid.push(`${row._id} (${row.ipAddress}, mac=${row.macAddress})`);
      continue;
    }

    const key = `${row.userId}:${mac}`;
    if (seen.has(key)) {
      duplicates.push(`${mac} for user ${row.userId}: ${seen.get(key)} and ${row._id}`);
      continue;
    }
    seen.set(key, row._id);

    const set: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};
    if (row.macAddress !== mac) set.macAddress = mac;
    if (row.role === undefined) set.role = "CLIENT";
    if (row.isUpstream === undefined) set.isUpstream = false;
    if (row.isRandomMac !== isRandomMac(mac)) set.isRandomMac = isRandomMac(mac);
    if (typeof row.isOnline !== "boolean") set.isOnline = false;
    if (row.deviceType === "ethernet") unset.deviceType = "";

    if (Object.keys(set).length || Object.keys(unset).length) {
      updated++;
      if (apply) {
        await devices.updateOne(
          { _id: row._id },
          {
            ...(Object.keys(set).length ? { $set: set } : {}),
            ...(Object.keys(unset).length ? { $unset: unset } : {}),
          },
        );
      }
    }

    if (row.ipAddress) {
      const exists = await addresses.findOne({ deviceId: row._id, ip: row.ipAddress });
      if (!exists) {
        addressesSeeded++;
        if (apply) {
          await addresses.insertOne({
            deviceId: row._id,
            ip: row.ipAddress,
            family: row.ipAddress.includes(":") ? "ip6" : "ip4",
            source: "arp",
            intf: row.intf ?? null,
            firstSeenAt: row.firstSeenAt ?? new Date(),
            lastSeenAt: row.lastSeenAt ?? new Date(),
          });
        }
      }
    }
  }

  const indexes = await devices.indexes();
  const oldIndex = indexes.find((index) => index.name === "NetworkDevice_userId_ipAddress_key");
  if (oldIndex && apply) {
    await devices.dropIndex("NetworkDevice_userId_ipAddress_key");
  }

  const settingRows = await settings.find({}).toArray();
  let secretsEncrypted = 0;
  for (const row of settingRows) {
    if (typeof row.apiSecret === "string" && row.apiSecret && !isEncryptedSecret(row.apiSecret)) {
      secretsEncrypted++;
      if (apply) {
        await settings.updateOne(
          { _id: row._id },
          { $set: { apiSecret: encryptSecret(row.apiSecret) } },
        );
      }
    }
  }

  console.log({
    devices: rows.length,
    devicesUpdated: updated,
    addressesSeeded,
    oldUniqueIpIndex: oldIndex ? (apply ? "dropped" : "will drop") : "absent",
    secretsEncrypted,
    duplicates,
    invalid,
  });

  await client.close();

  if (duplicates.length || invalid.length) {
    console.error("Resolve duplicates/invalid MACs before running `pnpm db:push`.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
