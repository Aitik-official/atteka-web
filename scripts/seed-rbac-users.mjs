import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const demos = [
  { userId: "AL002", name: "ANISHA OZARKAR", role: "OPERATOR" },
  { userId: "DEMO01", name: "DEMO OPERATOR", role: "OPERATOR" },
  { userId: "ADMIN01", name: "ADMINISTRATOR", role: "ADMIN" },
  { userId: "MGR01", name: "BRANCH MANAGER", role: "MANAGER" },
  { userId: "ACC01", name: "ACCOUNTS USER", role: "ACCOUNTS" },
  { userId: "GUEST01", name: "GUEST VIEWER", role: "GUEST" }
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
  const col = mongoose.connection.db.collection("users");
  const hash = bcrypt.hashSync("demo123", 10);
  const results = [];

  for (const d of demos) {
    const doc = {
      userId: d.userId,
      name: d.name,
      email: `${d.userId.toLowerCase()}@atteka.local`,
      passwordHash: hash,
      role: d.role,
      branchCode: "MUM",
      operatingLocation: "MUMBAI CENTRAL",
      financialYear: "2026-2027",
      isActive: true,
      updatedAt: new Date()
    };
    const r = await col.updateOne(
      { userId: d.userId },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    results.push({
      userId: d.userId,
      role: d.role,
      upserted: Boolean(r.upsertedCount),
      modified: r.modifiedCount
    });
  }

  const users = await col
    .find({})
    .project({ userId: 1, role: 1, name: 1, isActive: 1, branchCode: 1 })
    .toArray();

  console.log(
    JSON.stringify(
      {
        db: mongoose.connection.name,
        seeded: results,
        userCount: users.length,
        users
      },
      null,
      2
    )
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
