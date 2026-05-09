import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { planName } from "@/lib/plan-display";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const dashboard = dictionary.dashboard;
  const labels = {
    plan: uiText(locale, "套餐", "プラン", "Plan")
  };
  const user = await requireUser(locale);
  const orders = await prisma.order.findMany({
    include: { plan: true },
    orderBy: { createdAt: "desc" },
    where: { userId: user.id }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{dashboard.orders}</h1>
          <p className="small-muted">{dashboard.subtitle}</p>
        </div>
      </div>
      <DataTable
        columns={[dashboard.fields.order, labels.plan, dashboard.fields.amount, dashboard.fields.date, dashboard.fields.status]}
        rows={orders.map((order: any) => [
          <strong key="id">{order.id}</strong>,
          planName(order.plan, locale),
          formatMoney(order.amount, order.currency, locale),
          formatDate(order.createdAt, locale),
          <StatusBadge key="status" status={statusLabel(order.status, locale)} />
        ])}
      />
    </>
  );
}
