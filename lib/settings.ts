import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const algorithm = "aes-256-gcm";

function key() {
  const secret = process.env.SETTINGS_SECRET || process.env.AUTH_SECRET || "development-only-change-me";

  if (process.env.NODE_ENV === "production" && secret === "development-only-change-me") {
    throw new Error("SETTINGS_SECRET or AUTH_SECRET is required in production.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSetting(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSetting(value: string) {
  if (!value.startsWith("v1:")) {
    return "";
  }

  const [, iv, tag, encrypted] = value.split(":");
  const decipher = crypto.createDecipheriv(algorithm, key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export async function setSetting(keyName: string, value: string) {
  await prisma.setting.upsert({
    create: {
      encryptedValue: encryptSetting(value),
      key: keyName
    },
    update: {
      encryptedValue: encryptSetting(value)
    },
    where: {
      key: keyName
    }
  });
}

export async function getSetting(keyName: string, fallback = "") {
  const setting = await prisma.setting.findUnique({
    where: {
      key: keyName
    }
  });

  if (!setting) {
    return fallback;
  }

  try {
    return decryptSetting(setting.encryptedValue) || fallback;
  } catch {
    return fallback;
  }
}

export async function getVmosSettings() {
  return {
    accessKey: await getSetting("vmos_access_key", process.env.VMOS_ACCESS_KEY ?? ""),
    apiBaseUrl: await getSetting("vmos_api_base_url", process.env.VMOS_API_BASE_URL ?? "https://api.vmoscloud.com"),
    h5BaseUrl: await getSetting("vmos_h5_base_url", process.env.VMOS_H5_BASE_URL ?? "https://api.vmoscloud.com"),
    secretKey: await getSetting("vmos_secret_key", process.env.VMOS_SECRET_KEY ?? ""),
    tokenPath: await getSetting("vmos_token_path", process.env.VMOS_TOKEN_PATH ?? "/vcpcloud/api/padApi/stsTokenByPadCode")
  };
}
