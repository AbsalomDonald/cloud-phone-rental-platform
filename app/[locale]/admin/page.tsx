import Link from "next/link";
import { Boxes, CheckCircle2, Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { adminLabels } from "@/lib/admin-labels";
import { formatMoney, formatShortDate } from "@/lib/format";
import { planName } from "@/lib/plan-display";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = adminLabels(locale);
  const [orders, phones, usersCount, openTickets] = await Promise.all([
    prisma.order.findMany({ include: { plan: true, user: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.phone.findMany({ include: { assignments: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.user.count({ where: { role: "user" } }),
    prisma.supportTicket.count({ where: { status: "open" } })
  ]);
  const metrics = [
    { label: uiText(locale, "客户数", "顧客数", "Users"), value: String(usersCount) },
    { label: uiText(locale, "订单数", "注文数", "Orders"), value: String(await prisma.order.count()) },
    { label: uiText(locale, "空闲手机", "空き端末", "Available"), value: String(await prisma.phone.count({ where: { status: "available" } })) },
    { label: uiText(locale, "待回复工单", "未返信チケット", "Open Tickets"), value: String(openTickets) }
  ];

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.title}</h1>
          <p className="small-muted">{admin.subtitle}</p>
        </div>
        <div className="button-row" style={{ marginTop: 0 }}>
          <Link className="secondary-button" href={localizedPath(locale, "/admin/cloud-phones")}>
            <Boxes size={17} />
            {admin.actions.addDevice}
          </Link>
          <Link className="primary-button" href={localizedPath(locale, "/admin/assignments")}>
            <CheckCircle2 size={17} />
            {admin.actions.assign}
          </Link>
        </div>
      </div>

      <div className="metric-row">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <div>
              <h2>{admin.tables.latestOrders}</h2>
            </div>
            <Link className="ghost-button" href={localizedPath(locale, "/admin/orders")}>
              <Plus size={17} />
              {dictionary.nav.pricing}
            </Link>
          </div>
          <DataTable
            columns={[labels.order, labels.user, labels.plan, labels.amount, labels.status]}
            rows={orders.map((order: any) => [
              <strong key="id">{order.id}</strong>,
              order.user.email,
              planName(order.plan, locale),
              formatMoney(order.amount, order.currency, locale),
              <StatusBadge key="status" status={statusLabel(order.status, locale)} />
            ])}
          />
        </section>

        <section>
          <div className="section-heading">
            <div>
              <h2>{admin.tables.inventory}</h2>
            </div>
          </div>
          <DataTable
            columns={[labels.device, labels.padCode, labels.region, labels.status, labels.expires, labels.vmosExpires]}
            rows={phones.map((phone: any) => {
              const assignment = phone.assignments[0];
              return [
                <strong key="device">{phone.internalName}</strong>,
                phone.vmosPadCode,
                phone.region ?? "-",
                <StatusBadge key="status" status={statusLabel(phone.status, locale)} />,
                assignment ? formatShortDate(assignment.expiresAt, locale) : "-",
                formatShortDate(phone.vmosExpireAt, locale)
              ];
            })}
          />
        </section>
      </div>
    </>
  );
}
