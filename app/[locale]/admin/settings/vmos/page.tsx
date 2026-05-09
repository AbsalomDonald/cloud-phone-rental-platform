import { Save } from "lucide-react";
import { saveVmosSettingsAction } from "@/lib/actions";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getVmosSettings } from "@/lib/settings";
import { uiText } from "@/lib/ui-text";

export const dynamic = "force-dynamic";

export default async function VmosSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (isLocale(rawLocale) ? rawLocale : "ja") as Locale;
  const dictionary = await getDictionary(locale);
  const title = dictionary.admin.tables.vmosSettings ?? uiText(locale, "供应商 API 设置", "提供元API設定", "Provider API Settings");
  const settings = await getVmosSettings();
  const labels = {
    desc: uiText(locale, "运营者专用配置。这里填写上游云手机供应商的 API 信息，密钥只保存在服务器端并加密存储，不会显示给客户。", "運営者専用設定です。ここにクラウドスマホ提供元のAPI情報を入力します。秘密鍵はサーバー側だけで暗号化保存され、お客様へ表示されません。", "Operator-only settings. Keys are stored encrypted on the server and are never shown to customers."),
    apiBase: uiText(locale, "API Base URL（接口基础地址）", "API Base URL（API基本URL）", "API Base URL"),
    tokenPath: uiText(locale, "Token Path（获取临时 Token 路径）", "Token Path（一時Token取得パス）", "Token Path"),
    h5Base: uiText(locale, "网页连接 baseUrl", "Web接続 baseUrl", "Web access baseUrl"),
    accessKey: uiText(locale, "AccessKey / AK（留空表示不修改）", "AccessKey / AK（空欄なら変更なし）", "AccessKey / AK (leave blank to keep)"),
    secretKey: uiText(locale, "SecretKey / SK（留空表示不修改）", "SecretKey / SK（空欄なら変更なし）", "SecretKey / SK (leave blank to keep)"),
    encrypted: uiText(locale, "已加密保存", "暗号化して保存済み", "Encrypted and saved"),
    unset: uiText(locale, "未设置", "未設定", "Not set"),
    save: uiText(locale, "保存设置", "設定を保存", "Save")
  };

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>{title}</h1>
          <p className="small-muted">
            {labels.desc}
          </p>
        </div>
      </div>
      <form action={saveVmosSettingsAction} className="support-card form-stack">
        <input name="locale" type="hidden" value={locale} />
        <div className="grid-2">
          <div className="field">
            <label>{labels.apiBase}</label>
            <input defaultValue={settings.apiBaseUrl} name="apiBaseUrl" placeholder="https://api.vmoscloud.com" />
          </div>
          <div className="field">
            <label>{labels.tokenPath}</label>
            <input defaultValue={settings.tokenPath} name="tokenPath" placeholder="/vcpcloud/api/padApi/stsTokenByPadCode" />
          </div>
          <div className="field">
            <label>{labels.h5Base}</label>
            <input defaultValue={settings.h5BaseUrl} name="h5BaseUrl" placeholder="https://openapi-hk.armcloud.net" />
          </div>
          <div className="field">
            <label>{labels.accessKey}</label>
            <input name="accessKey" placeholder={settings.accessKey ? labels.encrypted : labels.unset} />
          </div>
          <div className="field">
            <label>{labels.secretKey}</label>
            <input name="secretKey" placeholder={settings.secretKey ? labels.encrypted : labels.unset} />
          </div>
        </div>
        <button className="primary-button" type="submit">
          <Save size={17} />
          {labels.save}
        </button>
      </form>
    </>
  );
}
