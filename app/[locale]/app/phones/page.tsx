import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function PhonesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const dashboard = dictionary.dashboard;
  const user = await requireUser(locale);
  const labels = {
    assignedOnly: uiText(locale, "这里只显示绑定到当前账号的云手机。", "このアカウントに割り当てられたクラウドスマホだけを表示します。", "Only cloud phones assigned to this account are shown."),
    cloudPhone: uiText(locale, "云手机", "クラウドスマホ", "Cloud Phone"),
    region: uiText(locale, "地区", "地域", "Region"),
    status: uiText(locale, "状态", "状態", "Status"),
    expires: uiText(locale, "用户到期", "ユーザー有効期限", "User Expires"),
    open: uiText(locale, "打开", "開く", "Open")
  };
  const assignments = await prisma.assignment.findMany({
    include: { phone: true },
    orderBy: { createdAt: "desc" },
    where: { userId: user.id }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{dashboard.cloudPhones}</h1>
          <p className="small-muted">
            {labels.assignedOnly}
          </p>
        </div>
      </div>
      <DataTable
        columns={[labels.cloudPhone, labels.region, labels.status, labels.expires, labels.open]}
        rows={assignments.map((assignment: any) => [
          <strong key="device">{assignment.phone.internalName}</strong>,
          assignment.phone.region ?? "-",
          <StatusBadge key="status" status={statusLabel(assignment.status, locale)} />,
          formatShortDate(assignment.expiresAt, locale),
          <Link className="primary-button" href={localizedPath(locale, `/app/phones/${assignment.phone.internalName}`)} key="open">
            <ExternalLink size={17} />
            {labels.open}
          </Link>
        ])}
      />
    </>
  );
}
