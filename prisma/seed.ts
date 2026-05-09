import crypto from "node:crypto";
import { hashPassword } from "../lib/password";

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const algorithm = "aes-256-gcm";

function settingsKey() {
  return crypto
    .createHash("sha256")
    .update(process.env.SETTINGS_SECRET || process.env.AUTH_SECRET || "development-only-change-me")
    .digest();
}

function encryptSeedSetting(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, settingsKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

async function main() {
  await prisma.adminLog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.vmosApiLog.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.phone.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();

  const plans = await Promise.all([
    prisma.plan.create({
      data: {
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
      }
    }),
    prisma.plan.create({
      data: {
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
      }
    }),
    prisma.plan.create({
      data: {
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
    })
  ]);

  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL ?? "admin@example.com",
      name: "Admin",
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD ?? "Admin12345!"),
      preferredLanguage: "ja",
      role: "admin"
    }
  });

  const user = await prisma.user.create({
    data: {
      email: "tanaka@example.jp",
      name: "Tanaka",
      passwordHash: hashPassword("User12345!"),
      preferredLanguage: "ja"
    }
  });

  const device = await prisma.phone.create({
    data: {
      internalName: "JP-001",
      vmosPadCode: "PAD-JP-001",
      region: "Japan",
      status: "assigned",
      vmosExpireAt: new Date("2026-06-10T00:00:00.000Z"),
      notes: "Seed VMOS phone for padCode assignment demo."
    }
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      planId: plans[1].id,
      amount: "3980",
      currency: "JPY",
      status: "paid",
      paymentProvider: "mock",
      paymentId: "mock_20260505_001",
      paidAt: new Date("2026-05-05T00:00:00.000Z")
    }
  });

  await prisma.assignment.create({
    data: {
      userId: user.id,
      phoneId: device.id,
      orderId: order.id,
      startedAt: new Date("2026-05-05T00:00:00.000Z"),
      expiresAt: new Date("2026-06-05T00:00:00.000Z"),
      status: "active"
    }
  });

  await prisma.supportTicket.create({
    data: {
      userId: user.id,
      title: "Login issue",
      message: "I cannot access my cloud phone login URL.",
      status: "open"
    }
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: "seed_created",
      targetType: "system",
      metadata: {
        message: "Initial demo data created"
      }
    }
  });

  await prisma.setting.createMany({
    data: [
      { key: "vmos_api_base_url", encryptedValue: encryptSeedSetting(process.env.VMOS_API_BASE_URL ?? "") },
      { key: "vmos_access_key", encryptedValue: encryptSeedSetting(process.env.VMOS_ACCESS_KEY ?? "") },
      { key: "vmos_secret_key", encryptedValue: encryptSeedSetting(process.env.VMOS_SECRET_KEY ?? "") },
      { key: "vmos_h5_base_url", encryptedValue: encryptSeedSetting(process.env.VMOS_H5_BASE_URL ?? "") },
      { key: "vmos_token_path", encryptedValue: encryptSeedSetting(process.env.VMOS_TOKEN_PATH ?? "/vcpcloud/api/padApi/stsTokenByPadCode") }
    ]
  });

  await prisma.vmosApiLog.create({
    data: {
      userId: user.id,
      phoneId: device.id,
      action: "open_phone_token",
      requestStatus: "success",
      metadata: {
        padCode: "PAD-JP-001"
      }
    }
  });
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
