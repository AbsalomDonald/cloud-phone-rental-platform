import Link from "next/link";
import { ExternalLink, Headphones, RefreshCw } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { requireUser } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/status-labels";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function UserAppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const dashboard = dictionary.dashboard;
  const user = await requireUser(locale);
  const [assignments, openTickets, pendingOrders] = await Promise.all([
    prisma.assignment.findMany({
      include: {
        order: true,
        phone: true
      },
      orderBy: { createdAt: "desc" },
      where: { userId: user.id }
    }),
    prisma.supportTicket.count({ where: { status: "open", userId: user.id } }),
    prisma.order.count({ where: { status: "pending", userId: user.id } })
  ]);
  const currentAssignment = assignments[0];
  const currentPhone = currentAssignment?.phone;
  const labels = {
    phones: uiText(locale, "我的云手机", "マイクラウドスマホ", "My Cloud Phones"),
    pendingOrders: uiText(locale, "待处理订单", "処理待ち注文", "Pending Orders"),
    openTickets: uiText(locale, "待回复工单", "未返信チケット", "Open Tickets"),
    secureProxy: uiText(locale, "你的手机权限由服务器安全中转。", "クラウドスマホ権限はサーバーで安全に中継されます。", "Access is securely proxied by the server."),
    openPhone: uiText(locale, "打开云手机", "クラウドスマホを開く", "Open Phone"),
    cloudPhone: uiText(locale, "云手机", "クラウドスマホ", "Cloud Phone"),
    tempAuth: uiText(locale, "临时授权", "一時認証", "Temporary Auth"),
    expires: uiText(locale, "到期", "有効期限", "Expires"),
    enter: uiText(locale, "进入画面", "画面を開く", "Enter"),
    openHelp: uiText(
      locale,
      "点击打开时，系统会先检查订单、绑定关系、到期时间和设备状态，然后由服务器生成临时授权。",
      "起動時は注文、割り当て、有効期限、端末状態を確認してからサーバーで一時認証を発行します。",
      "When opening, the server checks order, ownership, expiry, and device status before issuing temporary access."
    ),
    connection: uiText(locale, "连接方式", "接続方式", "Connection"),
    quality: uiText(locale, "默认画质", "標準画質", "Default Quality"),
    qualityValue: uiText(locale, "高清 · 30 FPS", "高画質 · 30 FPS", "HD · 30 FPS"),
    authStatus: uiText(locale, "授权状态", "認証状態", "Auth Status"),
    serverIssued: uiText(locale, "服务器临时签发", "サーバーで一時発行", "Server-issued"),
    enterH5: uiText(locale, "进入云手机画面", "クラウドスマホ画面へ", "Enter Cloud Phone View"),
    extendAccess: uiText(locale, "延长当前云手机权限", "現在のクラウドスマホ権限を延長", "Extend current cloud phone access"),
    submitIssue: uiText(locale, "提交使用问题", "利用中の問題を送信", "Submit usage issue"),
    secureFlow: uiText(locale, "安全链路", "安全な接続", "Secure Flow"),
    beforeOpen: uiText(locale, "打开前会检查", "起動前チェック", "Checks Before Opening"),
    noPhone: uiText(locale, "还没有分配云手机", "クラウドスマホはまだ割り当てられていません", "No cloud phone assigned yet"),
    noPhoneDesc: uiText(locale, "付款后，运营者会在后台把云手机绑定到你的账号。", "支払い後、運営者がクラウドスマホをあなたのアカウントに割り当てます。", "After payment, an operator will assign a cloud phone to your account."),
    choosePlan: uiText(locale, "选择套餐", "プランを選ぶ", "Choose Plan")
  };
  const metrics = [
    { label: labels.phones, value: String(assignments.length) },
    { label: labels.pendingOrders, value: String(pendingOrders) },
    { label: labels.openTickets, value: String(openTickets) }
  ];

  return (
    <>
      <div className="app-topbar">
        <div>
          <span className="badge blue">{uiText(locale, "云手机网页接入", "クラウドスマホWeb接続", "Cloud Phone Web Access")}</span>
          <h1>{dashboard.title}</h1>
          <p className="small-muted">
            {dashboard.subtitle} · {labels.secureProxy}
          </p>
        </div>
        <Link className="primary-button" href={localizedPath(locale, "/app/phones/JP-001")}>
          <ExternalLink size={17} />
          {labels.openPhone}
        </Link>
      </div>

      <div className="metric-row">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      {currentPhone ? (
      <section className="command-hero">
        <div className="control-card">
          <div className="control-card-inner">
            <div>
              <div className="device-title-row">
                <div>
                  <span className="badge">{statusLabel(currentAssignment.status, locale)}</span>
                  <h2>{currentPhone.internalName} {labels.cloudPhone}</h2>
                  <div className="device-subline">
                    <span className="badge">{labels.tempAuth}</span>
                    <span className="badge amber">{labels.expires}: {formatShortDate(currentAssignment.expiresAt, locale)}</span>
                  </div>
                </div>
                <Link className="primary-button" href={localizedPath(locale, `/app/phones/${currentPhone.internalName}`)}>
                  <ExternalLink size={17} />
                  {labels.enter}
                </Link>
              </div>
              <p className="small-muted">
                {labels.openHelp}
              </p>
              <div className="signal-strip">
                <div className="signal-item">
                  <span>{labels.connection}</span>
                  <strong>{uiText(locale, "网页远程连接", "Webリモート接続", "Web Remote Access")}</strong>
                </div>
                <div className="signal-item">
                  <span>{labels.quality}</span>
                  <strong>{labels.qualityValue}</strong>
                </div>
                <div className="signal-item">
                  <span>{labels.authStatus}</span>
                  <strong>{labels.serverIssued}</strong>
                </div>
              </div>
              <div className="action-grid">
                <Link className="action-tile" href={localizedPath(locale, `/app/phones/${currentPhone.internalName}`)}>
                  <strong>{labels.openPhone}</strong>
                  <span className="small-muted">{labels.enterH5}</span>
                </Link>
                <Link className="action-tile" href={localizedPath(locale, "/pricing")}>
                  <RefreshCw size={17} />
                  <strong>{dashboard.renew}</strong>
                  <span className="small-muted">{labels.extendAccess}</span>
                </Link>
                <Link className="action-tile" href={localizedPath(locale, "/app/support")}>
                  <Headphones size={17} />
                  <strong>{dashboard.contact}</strong>
                  <span className="small-muted">{labels.submitIssue}</span>
                </Link>
              </div>
            </div>
            <div className="mini-phone">
              <div className="mini-phone-top">
                <span>9:41</span>
                <span>Cloud</span>
              </div>
              <div className="mini-app-grid">
                {["APP", "WEB", "VIEW", "CPU", "FPS", "NET"].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="small-muted">Remote Android · Online</div>
            </div>
          </div>
        </div>

        <aside className="control-card">
          <div className="control-card-inner" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <span className="badge blue">{labels.secureFlow}</span>
              <h2 className="panel-title">{labels.beforeOpen}</h2>
            </div>
            <div className="token-flow">
              {[uiText(locale, "登录状态", "ログイン状態", "Login Status"), uiText(locale, "设备归属", "端末の割り当て", "Device Ownership"), uiText(locale, "到期和风控", "有効期限とリスク確認", "Expiration and Risk Check"), uiText(locale, "临时授权", "一時認証", "Temporary Access")].map((item, index) => (
                <div className="token-step" key={item}>
                  <div className="token-step-number">{index + 1}</div>
                  <div>
                    <strong>{item}</strong>
                    <span>{[uiText(locale, "确认是本人账号", "本人アカウントであることを確認", "Confirm account ownership"), uiText(locale, "只能打开自己绑定的手机", "自分に割り当てられた端末のみ起動", "Only assigned phones can be opened"), uiText(locale, "过期、禁用、频繁请求会拦截", "期限切れ、停止、頻繁なリクエストはブロック", "Expired, disabled, or frequent requests are blocked"), uiText(locale, "由服务器生成访问授权", "サーバーがアクセス認証を発行", "Issued by your server")][index]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
      ) : (
        <section className="notice-card">
          <h2 className="panel-title">{labels.noPhone}</h2>
          <p>{labels.noPhoneDesc}</p>
          <Link className="primary-button" href={localizedPath(locale, "/app/renew")}>
            {labels.choosePlan}
          </Link>
        </section>
      )}
    </>
  );
}
