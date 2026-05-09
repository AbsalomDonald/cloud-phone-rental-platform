import crypto from "node:crypto";
import { hashPassword } from "../lib/password";

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new () => any;
};

const prisma = new PrismaClient();
const algorithm = "aes-256-gcm";

function settingsKey() {
  return crypto
    .createHash("sha256")
    .update(process.env.SETTINGS_SECRET || process.env.AUTH_SECRET || "development-only-change-me")
    .digest();
}

function encryptSetting(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, settingsKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

async function upsertDefaultPlans() {
  const plans = [
    {
      code: "trial_7d",
      nameZh: "7日体验",
      nameJa: "7日間トライアル",
      nameEn: "7-Day Trial",
      descriptionZh: "适合第一次体验云手机的用户。",
      descriptionJa: "初めてクラウドスマホを確認したい方向け。",
      descriptionEn: "For users who want to try one cloud phone first.",
      price: "980",
      durationDays: 7,
      availableRegions: ["Japan", "Hong Kong"],
      stockQuantity: 10
    },
    {
      code: "standard_30d",
      nameZh: "30日标准",
      nameJa: "30日間スタンダード",
      nameEn: "30-Day Standard",
      descriptionZh: "适合普通单台云手机租赁。",
      descriptionJa: "通常利用に適した単台レンタル。",
      descriptionEn: "For regular single-device rental.",
      price: "3980",
      durationDays: 30,
      availableRegions: ["Japan", "Hong Kong", "Singapore"],
      stockQuantity: 20
    },
    {
      code: "business_bulk",
      nameZh: "商务批量",
      nameJa: "法人・一括利用",
      nameEn: "Business Bulk Plan",
      descriptionZh: "适合多台云手机和长期使用。",
      descriptionJa: "複数台や長期利用を相談したい方向け。",
      descriptionEn: "For multi-device or longer-term use.",
      price: "0",
      durationDays: null,
      availableRegions: ["Japan", "Hong Kong", "Singapore"],
      stockQuantity: null
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      create: plan,
      update: plan,
      where: { code: plan.code }
    });
  }
}

async function upsertAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD is missing. Skipping admin initialization.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash: hashPassword(password),
        preferredLanguage: "ja",
        role: "admin",
        status: "active"
      }
    });
    return;
  }

  await prisma.user.update({
    data: {
      role: "admin",
      status: "active",
      ...(process.env.RESET_ADMIN_PASSWORD_ON_INIT === "true" ? { passwordHash: hashPassword(password) } : {})
    },
    where: { email }
  });
}

async function upsertSettings() {
  const settings = [
    ["vmos_api_base_url", process.env.VMOS_API_BASE_URL],
    ["vmos_access_key", process.env.VMOS_ACCESS_KEY],
    ["vmos_secret_key", process.env.VMOS_SECRET_KEY],
    ["vmos_h5_base_url", process.env.VMOS_H5_BASE_URL],
    ["vmos_token_path", process.env.VMOS_TOKEN_PATH ?? "/vcpcloud/api/padApi/stsTokenByPadCode"]
  ].filter((item): item is [string, string] => Boolean(item[1]));

  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      create: { key, encryptedValue: encryptSetting(value) },
      update: {},
      where: { key }
    });
  }
}

async function main() {
  await upsertDefaultPlans();
  await upsertAdmin();
  await upsertSettings();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
