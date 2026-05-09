import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function configStatus() {
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  const settingsSecret = process.env.SETTINGS_SECRET || "";

  return {
    adminEmail: Boolean(process.env.ADMIN_EMAIL),
    adminPassword: Boolean(process.env.ADMIN_PASSWORD),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    authCookieSecure: process.env.AUTH_COOKIE_SECURE || "auto",
    authSecret: authSecret.length >= 32 && !authSecret.startsWith("change-this") && authSecret !== "development-only-change-me",
    coolifyInitOnStart: process.env.COOLIFY_INIT_ON_START === "true",
    databaseUrl: Boolean(process.env.DATABASE_URL),
    settingsSecret: settingsSecret.length >= 32 && !settingsSecret.startsWith("change-this"),
    vmosMock: process.env.ALLOW_VMOS_MOCK === "true"
  };
}

function databaseErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return String(error.code);
  }

  const message = error instanceof Error ? error.message : String(error);
  const matched = message.match(/\bP\d{4}\b/);

  if (matched?.[0]) {
    return matched[0];
  }

  if (message.includes("Can't reach database server") || message.includes("connect ECONNREFUSED")) {
    return "P1001";
  }

  if (message.includes("Authentication failed")) {
    return "P1000";
  }

  if (message.includes("Database") && message.includes("does not exist")) {
    return "P1003";
  }

  if (message.includes("does not exist in the current database")) {
    return "P2021";
  }

  return "unknown";
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      code: "database_missing_url",
      config: configStatus(),
      database: "missing_url",
      hint: "DATABASE_URL 未配置。前台可以打开，但注册、登录、后台和订单不能使用。请在 Coolify 应用环境变量里填写 PostgreSQL Internal URL。",
      service: "ouyang-cloud-phone-platform",
      status: "degraded"
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const [users, plans] = await Promise.all([
      prisma.user.count(),
      prisma.plan.count()
    ]);

    return NextResponse.json({
      config: configStatus(),
      database: "ok",
      plans,
      service: "ouyang-cloud-phone-platform",
      status: "ok",
      users
    });
  } catch (error) {
    const code = databaseErrorCode(error);
    const name = error instanceof Error ? error.name : "UnknownError";

    return NextResponse.json(
      {
        code,
        config: configStatus(),
        database: "error",
        hint:
          code === "P1001"
            ? "数据库连接失败，请检查 DATABASE_URL 是否使用 Coolify PostgreSQL 的 Internal URL。"
            : code === "P1000"
              ? "数据库账号或密码错误，请检查 DATABASE_URL。"
              : code === "P1003"
                ? "数据库不存在，请检查 DATABASE_URL 里的数据库名称。"
                : code === "P2021" || code === "P2022"
                ? "数据库表还没有创建，请确认启动命令会执行 prisma migrate deploy。"
                  : "数据库检查失败，请查看 Coolify 应用日志。",
        name,
        service: "ouyang-cloud-phone-platform",
        status: "error"
      }
    );
  }
}
