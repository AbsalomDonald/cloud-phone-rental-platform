import crypto from "node:crypto";

const keyLength = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, keyLength).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split("$");

  if (method !== "scrypt" || !salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, keyLength);
  const expected = Buffer.from(hash, "hex");

  if (candidate.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidate, expected);
}
