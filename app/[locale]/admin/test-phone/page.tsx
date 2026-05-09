import { Smartphone } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { createTestPhoneAssignmentAction } from "@/lib/actions";
import { adminLabels } from "@/lib/admin-labels";
import { formatShortDate } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminTestPhonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const labels = adminLabels(locale);
  const text = {
    title: uiText(locale, "测试手机开通", "テスト端末の開通", "Test Phone Access"),
    desc: uiText(
      locale,
      "无需真实付款，直接给用户创建一条测试订单并分配一台空闲云手机。",
      "実決済なしでテスト注文を作成し、空きクラウド端末をユーザーに割り当てます。",
      "Create a test order and assign an available cloud phone without real payment."
    ),
    user: uiText(locale, "用户", "ユーザー", "User"),
    phone: uiText(locale, "空闲测试手机", "空きテスト端末", "Available Test Phone"),
    save: uiText(locale, "开通测试手机", "テスト端末を開通", "Activate Test Phone"),
    recent: uiText(locale, "最近测试开通", "最近のテスト開通", "Recent Test Assignments"),
    emptyUsers: uiText(locale, "暂无可用普通用户，请先注册一个用户账号。", "利用可能な一般ユーザーがありません。先にユーザー登録してください。", "No active regular users. Register a user first."),
    emptyPhones: uiText(locale, "暂无空闲云手机，请先导入一台供应商设备。", "空きクラウド端末がありません。先に提供元端末を登録してください。", "No available cloud phones. Import a provider device first.")
  };

  const [users, phones, assignments] = await Promise.all([
    prisma.user.findMany({ orderBy: { email: "asc" }, where: { role: "user", status: "active" } }),
    prisma.phone.findMany({ orderBy: { internalName: "asc" }, where: { status: "available" } }),
    prisma.assignment.findMany({
      include: { order: true, phone: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      where: { order: { paymentProvider: "admin_test" } }
    })
  ]);

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{text.title}</h1>
          <p className="small-muted">{text.desc}</p>
        </div>
      </div>

      <section className="support-card" style={{ marginBottom: 18 }}>
        <h2 className="panel-title"><Smartphone size={17} />{text.save}</h2>
        <form action={createTestPhoneAssignmentAction} className="form-stack">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid-3">
            <div className="field">
              <label>{text.user}</label>
              <select name="userId" required>
                {users.map((user: any) => <option key={user.id} value={user.id}>{user.email}</option>)}
              </select>
              {users.length === 0 ? <p className="small-muted">{text.emptyUsers}</p> : null}
            </div>
            <div className="field">
              <label>{text.phone}</label>
              <select name="phoneId" required>
                {phones.map((phone: any) => <option key={phone.id} value={phone.id}>{phone.internalName} / {phone.vmosPadCode}</option>)}
              </select>
              {phones.length === 0 ? <p className="small-muted">{text.emptyPhones}</p> : null}
            </div>
            <div className="field">
              <label>{labels.expires}</label>
              <input name="expiresAt" required type="date" />
            </div>
          </div>
          <button className="primary-button" disabled={users.length === 0 || phones.length === 0} type="submit">
            {text.save}
          </button>
        </form>
      </section>

      <section>
        <div className="section-heading">
          <h2>{text.recent}</h2>
        </div>
        <DataTable
          columns={[labels.user, labels.device, labels.padCode, labels.order, labels.expires, labels.status]}
          rows={assignments.map((assignment: any) => [
            assignment.user.email,
            <strong key="device">{assignment.phone.internalName}</strong>,
            assignment.phone.vmosPadCode,
            assignment.order.id,
            formatShortDate(assignment.expiresAt, locale),
            <StatusBadge key="status" status={statusLabel(assignment.status, locale)} />
          ])}
        />
      </section>
    </>
  );
}
