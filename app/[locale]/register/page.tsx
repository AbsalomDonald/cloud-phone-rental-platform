import { UserPlus } from "lucide-react";
import Link from "next/link";
import { getDictionary, isLocale, localizedPath, type Locale } from "@/lib/i18n";
import { locales } from "@/lib/locales";
import { registerAction } from "@/lib/actions";
import { uiText } from "@/lib/ui-text";

export default async function RegisterPage({
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
    resolvedSearchParams?.error === "exists"
      ? uiText(locale, "这个邮箱已经注册过，请直接登录。", "このメールアドレスはすでに登録されています。ログインしてください。", "This email is already registered.")
      : resolvedSearchParams?.error === "config"
        ? uiText(locale, "线上登录密钥还没有配置，请管理员检查 AUTH_SECRET。", "本番ログイン用の秘密鍵が未設定です。管理者は AUTH_SECRET を確認してください。", "Production auth secret is not configured. Please check AUTH_SECRET.")
        : resolvedSearchParams?.error === "db-connection"
          ? uiText(locale, "注册失败：数据库连接不上。请检查 Coolify 的 DATABASE_URL 是否使用 PostgreSQL Internal URL。", "登録失敗：データベースに接続できません。Coolify の DATABASE_URL が PostgreSQL Internal URL になっているか確認してください。", "Registration failed: database is unreachable. Check DATABASE_URL.")
          : resolvedSearchParams?.error === "db-auth"
            ? uiText(locale, "注册失败：数据库账号或密码错误，请检查 DATABASE_URL。", "登録失敗：データベースのユーザー名またはパスワードが違います。DATABASE_URL を確認してください。", "Registration failed: database credentials are incorrect.")
            : resolvedSearchParams?.error === "db-missing"
              ? uiText(locale, "注册失败：数据库不存在，请检查 DATABASE_URL 里的数据库名称。", "登録失敗：データベースが存在しません。DATABASE_URL のデータベース名を確認してください。", "Registration failed: database does not exist.")
              : resolvedSearchParams?.error === "db-schema"
                ? uiText(locale, "注册失败：数据库表还没创建。请确认 Coolify 启动时执行了 prisma migrate deploy。", "登録失敗：データベーステーブルが未作成です。Coolify 起動時に prisma migrate deploy が実行されているか確認してください。", "Registration failed: database tables are missing.")
                : uiText(locale, "注册失败。请打开 /api/health 查看数据库检查结果。", "登録に失敗しました。/api/health を開いてデータベース状態を確認してください。", "Registration failed. Open /api/health to inspect database status.");

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>{auth.registerTitle}</h1>
        <p className="small-muted">{auth.registerSubtitle}</p>
        {resolvedSearchParams?.error ? (
          <div className="notice-card" style={{ margin: "14px 0" }}>
            {errorText}
          </div>
        ) : null}
        <form action={registerAction} className="form-stack">
          <input name="locale" type="hidden" value={locale} />
          <div className="field">
            <label htmlFor="name">{auth.name}</label>
            <input autoComplete="name" id="name" name="name" type="text" />
          </div>
          <div className="field">
            <label htmlFor="email">{auth.email}</label>
            <input autoComplete="email" id="email" name="email" required type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">{auth.password}</label>
            <input autoComplete="new-password" id="password" minLength={8} name="password" required type="password" />
          </div>
          <div className="field">
            <label htmlFor="language">{auth.language}</label>
            <select defaultValue={locale} id="language" name="language">
              {locales.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <button className="primary-button" type="submit">
            <UserPlus size={17} />
            {auth.registerButton}
          </button>
          <Link className="small-muted" href={localizedPath(locale, "/login")}>
            {dictionary.nav.login}
          </Link>
          <span className="small-muted">{auth.demoNote}</span>
        </form>
      </div>
    </section>
  );
}
