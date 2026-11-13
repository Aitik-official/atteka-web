import { jwtVerify } from "jose";
import type { UserSession } from "@/lib/auth";

function getSecretKey() {
  const secret =
    process.env.AUTH_SECRET || "super_secret_jwt_key_replica_development_2026";
  return new TextEncoder().encode(secret);
}

/** Edge-safe JWT verify (used by middleware). Same secret as Node `jsonwebtoken` HS256. */
export async function verifyTokenEdge(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"]
    });
    const userId = String(payload.userId || "");
    if (!userId) return null;
    return {
      userId,
      name: String(payload.name || userId),
      role: String(payload.role || "OPERATOR"),
      branchCode: String(payload.branchCode || "ALC1"),
      financialYear: String(payload.financialYear || "2026-2027")
    };
  } catch {
    return null;
  }
}
