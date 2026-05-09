import { CheckCircle2 } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { createAssignmentAction } from "@/lib/actions";
import { adminLabels } from "@/lib/admin-labels";
import { formatShortDate } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { planName } from "@/lib/plan-display";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = adminLabels(locale);
  const text = {
    desc: uiText(locale, "把已付款订单和空闲供应商设备编号绑定给客户。", "支払い済み注文と空き提供元端末番号をお客様へ割り当てます。", "Bind a paid order and an available provider device code to a customer."),
    user: uiText(locale, "用户", "ユーザー", "User"),
    availablePad: uiText(locale, "空闲供应商设备", "空き提供元端末", "Available provider device"),
    paidOrder: uiText(locale, "已付款订单", "支払い済み注文", "Paid Order"),
    save: uiText(locale, "保存分配", "割り当てを保存", "Save Assignment")
  };
  const [assignments, users, phones, orders] = await Promise.all([
    prisma.assignment.findMany({
      include: { order: true, phone: true, user: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({ orderBy: { email: "asc" }, where: { role: "user", status: "active" } }),
    prisma.phone.findMany({ orderBy: { internalName: "asc" }, where: { status: "available" } }),
    prisma.order.findMany({
      include: { plan: true, user: true },
      orderBy: { createdAt: "desc" },
      where: { assignment: { is: null }, status: "paid" }
    })
  ]);

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.tables.assignments}</h1>
          <p className="small-muted">{text.desc}</p>
        </div>
      </div>
      <section className="support-card" style={{ marginBottom: 18 }}>
        <h2 className="panel-title"><CheckCircle2 size={17} />{admin.actions.assign}</h2>
        <form action={createAssignmentAction} className="form-stack">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid-3">
            <div className="field">
              <label>{text.user}</label>
              <select name="userId" required>
                {users.map((user: any) => <option key={user.id} value={user.id}>{user.email}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{text.availablePad}</label>
              <select name="phoneId" required>
                {phones.map((phone: any) => <option key={phone.id} value={phone.id}>{phone.internalName} / {phone.vmosPadCode}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{text.paidOrder}</label>
              <select name="orderId" required>
                {orders.map((order: any) => <option key={order.id} value={order.id}>{order.user.email} / {planName(order.plan, locale)} / {order.id}</option>)}
              </select>
            </div>
            <div className="field"><label>{labels.expires}</label><input name="expiresAt" required type="date" /></div>
          </div>
          <button className="primary-button" type="submit">{text.save}</button>
        </form>
      </section>
      <DataTable
        columns={[labels.assignment, labels.user, labels.device, labels.padCode, labels.order, labels.expires, labels.status]}
        rows={assignments.map((row: any) => [
          <strong key="id">{row.id}</strong>,
          row.user.email,
          row.phone.internalName,
          row.phone.vmosPadCode,
          row.order.id,
          formatShortDate(row.expiresAt, locale),
          <StatusBadge key="status" status={statusLabel(row.status, locale)} />
        ])}
      />
    </>
  );
}
