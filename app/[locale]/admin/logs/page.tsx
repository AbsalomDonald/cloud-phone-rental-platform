import { DataTable } from "@/components/DataTable";
import { adminLabels } from "@/lib/admin-labels";
import { formatDate } from "@/lib/format";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const labels = adminLabels(locale);
  const title = dictionary.admin.tables.logs ?? uiText(locale, "操作日志", "操作ログ", "Operation Logs");
  const desc = uiText(locale, "记录客户打开云手机、供应商 API 调用、管理员分配和设置修改。", "クラウドスマホ起動、提供元API呼び出し、管理者の割り当て、設定変更を記録します。", "Track phone opens, provider API calls, assignments, and admin changes.");
  const [adminLogs, apiLogs] = await Promise.all([
    prisma.adminLog.findMany({
      include: { admin: true },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.vmosApiLog.findMany({
      include: { phone: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{title}</h1>
          <p className="small-muted">
            {desc}
          </p>
        </div>
      </div>
      <DataTable
        columns={[labels.date, labels.user, labels.device, labels.padCode, labels.action, uiText(locale, "结果", "結果", "Result"), uiText(locale, "备注", "メモ", "Note")]}
        rows={[
          ...apiLogs.map((log: any) => [
            formatDate(log.createdAt, locale),
            log.user?.email ?? "-",
            log.phone?.internalName ?? "-",
            log.phone?.vmosPadCode ?? "-",
            log.action,
            log.requestStatus,
            log.errorMessage ?? "-"
          ]),
          ...adminLogs.map((log: any) => [
            formatDate(log.createdAt, locale),
            log.admin?.email ?? "system",
            log.targetId ?? "-",
            "-",
            log.action,
            "success",
            log.targetType
          ])
        ]}
      />
    </>
  );
}
