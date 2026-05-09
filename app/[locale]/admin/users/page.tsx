import { UserPlus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { adminLabels } from "@/lib/admin-labels";
import { formatDate } from "@/lib/format";
import { statusLabel } from "@/lib/status-labels";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const admin = dictionary.admin;
  const labels = adminLabels(locale);
  const text = {
    passwordNotice: uiText(locale, "用户密码必须加密保存，后台不能查看原始密码。客户忘记密码时，请使用重置密码或发送重置链接。", "ユーザーパスワードは暗号化保存が必須です。管理画面で元のパスワードは表示せず、忘れた場合は再設定または再設定リンクを使います。", "Passwords should be encrypted and never displayed in plain text. Use reset actions when users forget them."),
    encrypted: uiText(locale, "已加密，不可查看", "暗号化済み・表示不可", "Encrypted, hidden"),
    reset: uiText(locale, "重置密码", "パスワード再設定", "Reset")
  };
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{admin.tables.users}</h1>
          <p className="small-muted">{admin.subtitle}</p>
        </div>
        <button className="secondary-button" type="button">
          <UserPlus size={17} />
          {dictionary.nav.register}
        </button>
      </div>
      <div className="notice-card" style={{ marginBottom: 16 }}>
        <h2 className="panel-title">{labels.passwordStatus}</h2>
        <p>
          {text.passwordNotice}
        </p>
      </div>
      <DataTable
        columns={[
          labels.email,
          labels.name,
          labels.language,
          labels.role,
          labels.status,
          labels.passwordStatus,
          labels.createdAt,
          labels.lastLoginAt,
          labels.lastLoginIp,
          labels.passwordAction
        ]}
        rows={users.map((user: any) => [
          <strong key="email">{user.email}</strong>,
          user.name ?? "-",
          user.preferredLanguage,
          user.role,
          <StatusBadge key="status" status={statusLabel(user.status, locale)} />,
          text.encrypted,
          formatDate(user.createdAt, locale),
          formatDate(user.lastLoginAt, locale),
          user.lastLoginIp ?? "-",
          <button className="secondary-button" key="reset" type="button">
            {text.reset}
          </button>
        ])}
      />
    </>
  );
}
