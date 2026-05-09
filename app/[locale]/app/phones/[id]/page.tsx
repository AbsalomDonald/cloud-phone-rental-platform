import { notFound } from "next/navigation";
import { CloudPhoneConnector } from "@/components/CloudPhoneConnector";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function PhoneViewPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id, locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const user = await requireUser(locale);
  const labels = {
    disconnect: uiText(locale, "断开连接", "切断", "Disconnect"),
    reconnect: uiText(locale, "重新连接", "再接続", "Reconnect"),
    rotate: uiText(locale, "横屏/竖屏", "横向き/縦向き", "Rotate"),
    connect: uiText(locale, "连接云手机", "クラウドスマホに接続", "Connect"),
    connecting: uiText(locale, "正在申请临时授权...", "一時認証を申請中...", "Requesting temporary access..."),
    disconnected: uiText(locale, "未连接", "未接続", "Disconnected"),
    sdkMissing: uiText(locale, "连接组件尚未安装，请联系客服。", "接続コンポーネントが未設定です。サポートへお問い合わせください。", "Connection component is not installed. Please contact support."),
    tokenReady: uiText(locale, "临时授权已签发，正在打开画面...", "一時認証を発行しました。画面を起動しています...", "Temporary access issued. Opening view..."),
    viewTitle: uiText(locale, "云手机画面区域", "クラウドスマホ画面エリア", "Cloud Phone View"),
    viewDesc: uiText(
      locale,
      "点击连接时，系统会先检查账号、设备绑定关系和到期时间，再由服务器签发临时授权。",
      "接続時は、アカウント、端末割り当て、有効期限を確認してからサーバーで一時認証を発行します。",
      "When connecting, the server checks account, device ownership, and expiry before issuing temporary access."
    )
  };
  const assignment = await prisma.assignment.findFirst({
    include: { phone: true },
    where: {
      phone: {
        internalName: decodeURIComponent(id)
      },
      userId: user.id
    }
  });

  if (!assignment) {
    notFound();
  }

  return (
    <div className="phone-stage">
      <div className="phone-controlbar">
        <div>
          <strong>{assignment.phone.internalName} {uiText(locale, "云手机", "クラウドスマホ", "Cloud Phone")}</strong>
          <span className="small-muted">
            {" "}{uiText(locale, "到期", "有効期限", "Expires")}: {formatDate(assignment.expiresAt, locale)}
          </span>
        </div>
      </div>
      <CloudPhoneConnector apiPath={`/api/me/phones/${encodeURIComponent(assignment.phone.internalName)}/open`} labels={labels} />
    </div>
  );
}
