import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Locale } from "@/lib/locales";

const sessionCookie = "ouyang_session";
const maxAgeSeconds = 60 * 60 * 24 * 14;

type SessionPayload = {
  exp: number;
  role: "user" | "admin";
  userId: string;
};

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-only-change-me";

  if (process.env.NODE_ENV === "production" && value === "development-only-change-me") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return value;
}

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.AUTH_COOKIE_SECURE === "false") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) {
    return true;
  }

  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("http://")) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function base64url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function decodeSession(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export async function clientIp() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");

  return forwardedFor?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}

export async function setSession(user: { id: string; role: "user" | "admin" }) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const token = encodeSession({ exp, role: user.role, userId: user.id });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: shouldUseSecureCookie()
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = decodeSession(cookieStore.get(sessionCookie)?.value);
    if (!session) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || user.status !== "active") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Unable to read current user session.", error);
    return null;
  }
}

export async function requireUser(locale: Locale) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return user;
}

export async function requireAdmin(locale: Locale) {
  const user = await requireUser(locale);

  if (user.role !== "admin") {
    redirect(`/${locale}/app`);
  }

  return user;
}
