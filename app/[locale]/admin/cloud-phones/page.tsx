import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { createPhoneAction } from "@/lib/actions";
import { adminLabels } from "@/lib/admin-labels";
import { formatShortDate } from "@/lib/format";
import { statusLabel } from "@/lib/status-labels";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminCloudPhonesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = adminLabels(locale);
  const text = {
    desc: uiText(locale, "导入上游云手机供应商的设备编号。客户不会看到 AK/SK，也不会看到供应商信息，只能打开被分配给自己的手机。", "上流クラウドスマホ提供元の端末番号を登録します。お客様にAK/SKや提供元情報は表示されず、自分に割り当てられた端末だけを開けます。", "Import provider device codes. Customers cannot see AK/SK or provider details and can only open assigned phones."),
    importPad: uiText(locale, "导入供应商设备编号", "提供元端末番号を登録", "Import Provider Device Code"),
    notes: uiText(locale, "备注", "メモ", "Notes")
  };
  const phones = await prisma.phone.findMany({
    include: {
      assignments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.tables.inventory}</h1>
          <p className="small-muted">{text.desc}</p>
        </div>
      </div>
      <section className="support-card" style={{ marginBottom: 18 }}>
        <h2 className="panel-title"><Plus size={17} />{admin.actions.addDevice}</h2>
        <form action={createPhoneAction} className="form-stack">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid-3">
            <div className="field"><label>{labels.device}</label><input name="internalName" placeholder="JP-001" required /></div>
            <div className="field"><label>{labels.padCode}</label><input name="vmosPadCode" placeholder="PAD-JP-001" required /></div>
            <div className="field"><label>{labels.region}</label><input name="region" placeholder="Japan" /></div>
            <div className="field"><label>{labels.vmosExpires}</label><input name="vmosExpireAt" type="date" /></div>
            <div className="field"><label>{text.notes}</label><input name="notes" /></div>
          </div>
          <button className="primary-button" type="submit">{text.importPad}</button>
        </form>
      </section>
      <DataTable
        columns={[labels.device, labels.padCode, labels.region, labels.status, labels.user, labels.expires, labels.vmosExpires]}
        rows={phones.map((phone: any) => {
          const latest = phone.assignments[0];
          return [
            <strong key="device">{phone.internalName}</strong>,
            phone.vmosPadCode,
            phone.region ?? "-",
            <StatusBadge key="status" status={statusLabel(phone.status, locale)} />,
            latest?.user.email ?? "-",
            latest ? formatShortDate(latest.expiresAt, locale) : "-",
            formatShortDate(phone.vmosExpireAt, locale)
          ];
        })}
      />
    </>
  );
}
