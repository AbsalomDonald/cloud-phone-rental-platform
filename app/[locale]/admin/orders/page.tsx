import { DataTable } from "@/components/DataTable";
import { updateOrderStatusAction } from "@/lib/actions";
import { adminLabels } from "@/lib/admin-labels";
import { formatDate, formatMoney } from "@/lib/format";
import { statusLabel } from "@/lib/status-labels";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { planName } from "@/lib/plan-display";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = adminLabels(locale);
  const save = uiText(locale, "保存", "保存", "Save");
  const orders = await prisma.order.findMany({
    include: { plan: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.tables.latestOrders}</h1>
          <p className="small-muted">{admin.subtitle}</p>
        </div>
      </div>
      <DataTable
        columns={[labels.order, labels.user, labels.plan, labels.amount, labels.status]}
        rows={orders.map((order: any) => [
          <strong key="id">{order.id}</strong>,
          <span key="user">{order.user.email}<br /><span className="table-meta">{formatDate(order.createdAt, locale)}</span></span>,
          planName(order.plan, locale),
          formatMoney(order.amount, order.currency, locale),
          <form action={updateOrderStatusAction} className="button-row" key="status" style={{ marginTop: 0 }}>
            <input name="locale" type="hidden" value={locale} />
            <input name="id" type="hidden" value={order.id} />
            <select defaultValue={order.status} name="status">
              {["pending", "paid", "fulfilled", "cancelled", "refunded"].map((status) => (
                <option key={status} value={status}>{statusLabel(status, locale)}</option>
              ))}
            </select>
            <button className="secondary-button" type="submit">{save}</button>
          </form>
        ])}
      />
    </>
  );
}
