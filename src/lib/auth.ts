import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET || "super_secret_jwt_key_replica_development_2026";
const COOKIE_NAME = "wcv_auth_session";

export interface UserSession {
  userId: string;
  name: string;
  role: string;
  branchCode: string;
  financialYear: string;
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function verifyPassword(plainText: string, hashed: string): boolean {
  return bcrypt.compareSync(plainText, hashed);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

