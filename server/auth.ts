import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, profiles } from "../drizzle/schema";
import type { User } from "../drizzle/schema";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aitech4human-fallback-secret-change-in-prod"
);
const JWT_EXPIRY = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: number; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: number; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number; role: string };
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  return result[0] ?? null;
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: "admin" | "member";
}): Promise<{ user: User; token: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) throw new Error("Email already registered");

  const passwordHash = await hashPassword(data.password);

  await db.insert(users).values({
    email: data.email,
    passwordHash,
    name: data.name,
    role: data.role ?? "member",
    isActive: true,
    lastSignedIn: new Date(),
  });

  const created = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  const user = created[0]!;

  // Create empty profile
  await db.insert(profiles).values({ userId: user.id });

  const token = await signToken({ userId: user.id, role: user.role });
  return { user, token };
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  const user = result[0];

  if (!user || !user.isActive) throw new Error("Invalid credentials");

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  const token = await signToken({ userId: user.id, role: user.role });
  return { user, token };
}
