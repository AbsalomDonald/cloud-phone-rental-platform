import Link from "next/link";
import { LogIn } from "lucide-react";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { loginAction } from "@/lib/actions";
import { uiText } from "@/lib/ui-text";

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const auth = dictionary.auth;
  const errorText =
    resolvedSearchParams?.error === "config"
      ? uiText(locale, "线上登录密钥还没有配置，请管理员检查 AUTH_SECRET。", "本番ログイン用の秘密鍵が未設定です。管理者は AUTH_SECRET を確認してください。", "Production auth secret is not configured. Please check AUTH_SECRET.")
      : resolvedSearchParams?.error?.startsWith("db-")
        ? uiText(locale, "登录失败：数据库连接或表结构异常，请打开 /api/health 查看检查结果。", "ログイン失敗：データベース接続またはテーブル構造に問題があります。/api/health を確認してください。", "Login failed: database connection or schema issue. Open /api/health.")
        : resolvedSearchParams?.error === "server"
          ? uiText(locale, "登录暂时失败，请检查线上数据库是否已连接并完成建表。", "ログインに失敗しました。本番データベースの接続とテーブル作成状況を確認してください。", "Login failed. Please check the production database connection and migrations.")
        : uiText(locale, "邮箱或密码不正确，或者账号已被停用。", "メールアドレスまたはパスワードが正しくないか、アカウントが停止されています。", "Invalid email/password or inactive account.");

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>{auth.loginTitle}</h1>
        <p className="small-muted">{auth.loginSubtitle}</p>
        {resolvedSearchParams?.error ? (
          <div className="notice-card" style={{ margin: "14px 0" }}>
            {errorText}
          </div>
        ) : null}
        <form action={loginAction} className="form-stack">
          <input name="locale" type="hidden" value={locale} />
          <div className="field">
            <label htmlFor="email">{auth.email}</label>
            <input autoComplete="email" id="email" name="email" required type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">{auth.password}</label>
            <input autoComplete="current-password" id="password" minLength={8} name="password" required type="password" />
          </div>
          <button className="primary-button" type="submit">
            <LogIn size={17} />
            {auth.loginButton}
          </button>
          <Link className="small-muted" href={localizedPath(locale, "/register")}>
            {dictionary.nav.register}
          </Link>
          <span className="small-muted">{auth.demoNote}</span>
        </form>
      </div>
    </section>
  );
}
