"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authenticate, clearSession, clientIp, requireAdmin, requireUser, setSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { setSetting } from "@/lib/settings";
import { isLocale, type Locale } from "@/lib/locales";

function formLocale(formData: FormData): Locale {
  const locale = String(formData.get("locale") || "ja");
  return isLocale(locale) ? locale : "ja";
}

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

function optional(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function databaseErrorParam(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  if (code === "P1001") {
    return "db-connection";
  }

  if (code === "P1000") {
    return "db-auth";
  }

  if (code === "P1003") {
    return "db-missing";
  }

  if (code === "P2021" || code === "P2022") {
    return "db-schema";
  }

  return "server";
}

async function logAdmin(adminId: string | undefined, action: string, targetType: string, targetId?: string, metadata?: object) {
  await prisma.adminLog.create({
    data: {
      action,
      adminId,
      metadata: metadata ?? undefined,
      targetId,
      targetType
    }
  });
}

export async function loginAction(formData: FormData) {
  const locale = formLocale(formData);
  const email = required(formData, "email").toLowerCase();
  const password = required(formData, "password");
  let user: Awaited<ReturnType<typeof authenticate>>;

  try {
    user = await authenticate(email, password);
  } catch (error) {
    console.error("Login database check failed.", error);
    redirect(`/${locale}/login?error=${databaseErrorParam(error)}`);
  }

  if (!user) {
    redirect(`/${locale}/login?error=invalid`);
  }

  try {
    await prisma.user.update({
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: await clientIp()
      },
      where: { id: user.id }
    });
  } catch (error) {
    console.error("Login metadata update failed.", error);
    redirect(`/${locale}/login?error=${databaseErrorParam(error)}`);
  }

  try {
    await setSession({ id: user.id, role: user.role as "user" | "admin" });
  } catch {
    redirect(`/${locale}/login?error=config`);
  }
  redirect(user.role === "admin" ? `/${locale}/admin` : `/${locale}/app`);
}

export async function registerAction(formData: FormData) {
  const locale = formLocale(formData);
  const email = required(formData, "email").toLowerCase();
  const password = required(formData, "password");
  const preferredLanguage = isLocale(String(formData.get("language"))) ? String(formData.get("language")) as Locale : locale;

  let exists: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  try {
    exists = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error("Registration database lookup failed.", error);
    redirect(`/${locale}/register?error=${databaseErrorParam(error)}`);
  }
  if (exists) {
    redirect(`/${locale}/register?error=exists`);
  }

  let user: Awaited<ReturnType<typeof prisma.user.create>>;
  try {
    user = await prisma.user.create({
      data: {
        email,
        lastLoginAt: new Date(),
        lastLoginIp: await clientIp(),
        name: optional(formData, "name") || null,
        passwordHash: hashPassword(password),
        preferredLanguage,
        role: "user",
        status: "active"
      }
    });
  } catch (error) {
    console.error("Registration user creation failed.", error);
    redirect(`/${locale}/register?error=${databaseErrorParam(error)}`);
  }

  try {
    await setSession({ id: user.id, role: user.role as "user" | "admin" });
  } catch {
    redirect(`/${locale}/register?error=config`);
  }
  redirect(`/${locale}/app`);
}

export async function logoutAction(formData: FormData) {
  const locale = formLocale(formData);
  await clearSession();
  redirect(`/${locale}/login`);
}

export async function createOrderAction(formData: FormData) {
  const locale = formLocale(formData);
  const user = await requireUser(locale);
  const planId = required(formData, "planId");
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });

  await prisma.order.create({
    data: {
      amount: plan.price,
      currency: plan.currency,
      paymentProvider: "manual",
      planId: plan.id,
      planName: plan.nameJa,
      status: "pending",
      userId: user.id
    }
  });

  revalidatePath(`/${locale}/app/orders`);
  redirect(`/${locale}/app/orders`);
}

export async function createTicketAction(formData: FormData) {
  const locale = formLocale(formData);
  const user = await requireUser(locale);

  await prisma.supportTicket.create({
    data: {
      message: required(formData, "message"),
      title: required(formData, "title"),
      userId: user.id
    }
  });

  revalidatePath(`/${locale}/app/support`);
  redirect(`/${locale}/app/support`);
}

export async function createPlanAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const code = required(formData, "code");

  const plan = await prisma.plan.create({
    data: {
      availableRegions: optional(formData, "availableRegions").split(",").map((item) => item.trim()).filter(Boolean),
      code,
      currency: optional(formData, "currency") || "JPY",
      descriptionEn: optional(formData, "descriptionEn") || optional(formData, "descriptionZh"),
      descriptionJa: optional(formData, "descriptionJa") || optional(formData, "descriptionZh"),
      descriptionZh: required(formData, "descriptionZh"),
      durationDays: optional(formData, "durationDays") ? Number(optional(formData, "durationDays")) : null,
      isActive: formData.get("isActive") === "on",
      nameEn: optional(formData, "nameEn") || optional(formData, "nameZh"),
      nameJa: optional(formData, "nameJa") || optional(formData, "nameZh"),
      nameZh: required(formData, "nameZh"),
      price: required(formData, "price"),
      stockQuantity: optional(formData, "stockQuantity") ? Number(optional(formData, "stockQuantity")) : null
    }
  });

  await logAdmin(admin.id, "plan_created", "plan", plan.id, { code });
  revalidatePath(`/${locale}/admin/plans`);
  redirect(`/${locale}/admin/plans`);
}

export async function updatePlanAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const id = required(formData, "id");

  const plan = await prisma.plan.update({
    data: {
      availableRegions: optional(formData, "availableRegions").split(",").map((item) => item.trim()).filter(Boolean),
      currency: optional(formData, "currency") || "JPY",
      descriptionEn: optional(formData, "descriptionEn") || optional(formData, "descriptionZh"),
      descriptionJa: optional(formData, "descriptionJa") || optional(formData, "descriptionZh"),
      descriptionZh: required(formData, "descriptionZh"),
      durationDays: optional(formData, "durationDays") ? Number(optional(formData, "durationDays")) : null,
      isActive: formData.get("isActive") === "on",
      nameEn: optional(formData, "nameEn") || optional(formData, "nameZh"),
      nameJa: optional(formData, "nameJa") || optional(formData, "nameZh"),
      nameZh: required(formData, "nameZh"),
      price: required(formData, "price"),
      stockQuantity: optional(formData, "stockQuantity") ? Number(optional(formData, "stockQuantity")) : null
    },
    where: { id }
  });

  await logAdmin(admin.id, "plan_updated", "plan", plan.id, { code: plan.code });
  revalidatePath(`/${locale}/admin/plans`);
  redirect(`/${locale}/admin/plans`);
}

export async function togglePlanAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const id = required(formData, "id");
  const current = await prisma.plan.findUniqueOrThrow({ where: { id } });
  const plan = await prisma.plan.update({
    data: { isActive: !current.isActive },
    where: { id }
  });

  await logAdmin(admin.id, "plan_toggled", "plan", plan.id, { isActive: plan.isActive });
  revalidatePath(`/${locale}/admin/plans`);
  redirect(`/${locale}/admin/plans`);
}

export async function createPhoneAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const phone = await prisma.phone.create({
    data: {
      internalName: required(formData, "internalName"),
      notes: optional(formData, "notes") || null,
      region: optional(formData, "region") || null,
      status: "available",
      vmosExpireAt: optional(formData, "vmosExpireAt") ? new Date(optional(formData, "vmosExpireAt")) : null,
      vmosPadCode: required(formData, "vmosPadCode")
    }
  });

  await logAdmin(admin.id, "phone_created", "phone", phone.id, { padCode: phone.vmosPadCode });
  revalidatePath(`/${locale}/admin/phones`);
  redirect(`/${locale}/admin/phones`);
}

export async function updateOrderStatusAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const id = required(formData, "id");
  const status = required(formData, "status") as "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
  const order = await prisma.order.update({
    data: {
      paidAt: status === "paid" ? new Date() : undefined,
      status
    },
    where: { id }
  });

  await logAdmin(admin.id, "order_status_updated", "order", order.id, { status });
  revalidatePath(`/${locale}/admin/orders`);
  redirect(`/${locale}/admin/orders`);
}

export async function createAssignmentAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const userId = required(formData, "userId");
  const phoneId = required(formData, "phoneId");
  const orderId = required(formData, "orderId");
  const expiresAt = new Date(required(formData, "expiresAt"));

  const assignment = await prisma.$transaction(async (tx: any) => {
    const created = await tx.assignment.create({
      data: {
        expiresAt,
        orderId,
        phoneId,
        startedAt: new Date(),
        status: "active",
        userId
      }
    });
    await tx.phone.update({
      data: { status: "assigned" },
      where: { id: phoneId }
    });
    await tx.order.update({
      data: { status: "fulfilled" },
      where: { id: orderId }
    });
    return created;
  });

  await logAdmin(admin.id, "assignment_created", "assignment", assignment.id, { orderId, phoneId, userId });
  revalidatePath(`/${locale}/admin/assignments`);
  redirect(`/${locale}/admin/assignments`);
}

export async function replyTicketAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const id = required(formData, "id");
  const ticket = await prisma.supportTicket.update({
    data: {
      adminReply: required(formData, "adminReply"),
      status: "replied"
    },
    where: { id }
  });

  await logAdmin(admin.id, "ticket_replied", "support_ticket", ticket.id);
  revalidatePath(`/${locale}/admin/support`);
  redirect(`/${locale}/admin/support`);
}

export async function closeTicketAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);
  const id = required(formData, "id");
  const ticket = await prisma.supportTicket.update({
    data: { status: "closed" },
    where: { id }
  });

  await logAdmin(admin.id, "ticket_closed", "support_ticket", ticket.id);
  revalidatePath(`/${locale}/admin/support`);
  redirect(`/${locale}/admin/support`);
}

export async function saveVmosSettingsAction(formData: FormData) {
  const locale = formLocale(formData);
  const admin = await requireAdmin(locale);

  await setSetting("vmos_api_base_url", optional(formData, "apiBaseUrl"));
  await setSetting("vmos_h5_base_url", optional(formData, "h5BaseUrl"));
  await setSetting("vmos_token_path", optional(formData, "tokenPath"));

  if (optional(formData, "accessKey")) {
    await setSetting("vmos_access_key", optional(formData, "accessKey"));
  }
  if (optional(formData, "secretKey")) {
    await setSetting("vmos_secret_key", optional(formData, "secretKey"));
  }

  await logAdmin(admin.id, "vmos_settings_saved", "settings", "vmos");
  revalidatePath(`/${locale}/admin/settings/vmos`);
  redirect(`/${locale}/admin/settings/vmos`);
}
