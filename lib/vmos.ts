import crypto from "node:crypto";
import { getVmosSettings } from "@/lib/settings";

export type VmosTokenResult = {
  baseUrl: string;
  deviceInfo: {
    padCode: string;
    userId: string;
  };
  expiresIn: number;
  token: string;
};

const SERVICE = "armcloud-paas";
const ALGORITHM = "HMAC-SHA256";
const SIGNED_HEADERS = "content-type;host;x-content-sha256;x-date";
const CONTENT_TYPE = "application/json;charset=UTF-8";

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function utcSignatureDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}

function vmosSignedHeaders(url: URL, body: string, accessKey: string, secretKey: string) {
  const xDate = utcSignatureDate();
  const shortDate = xDate.slice(0, 8);
  const host = url.host;

  const contentHash = sha256Hex(body);

  const canonicalString = [
    `host:${host}`,
    `x-date:${xDate}`,
    `content-type:${CONTENT_TYPE}`,
    `signedHeaders:${SIGNED_HEADERS}`,
    `x-content-sha256:${contentHash}`
  ].join("\n");

  const credentialScope = `${shortDate}/${SERVICE}/request`;

  const stringToSign = [
    ALGORITHM,
    xDate,
    credentialScope,
    sha256Hex(canonicalString)
  ].join("\n");

  const kDate = hmacSha256(secretKey, shortDate);
  const kService = hmacSha256(kDate, SERVICE);
  const signingKey = hmacSha256(kService, "request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return {
    "content-type": CONTENT_TYPE,
    "x-date": xDate,
    "x-host": host,
    authorization: `${ALGORITHM} Credential=${accessKey}/${credentialScope}, SignedHeaders=${SIGNED_HEADERS}, Signature=${signature}`
  };
}

function tokenFromPayload(payload: any) {
  return (
    payload?.data?.token ||
    payload?.data?.stsToken ||
    payload?.data?.sdkToken ||
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    payload?.token ||
    payload?.stsToken ||
    payload?.sdkToken ||
    payload?.accessToken ||
    payload?.access_token
  );
}

export async function requestVmosToken(padCode: string, userId: string): Promise<VmosTokenResult> {
  const settings = await getVmosSettings();
  const allowMock = process.env.ALLOW_VMOS_MOCK === "true";

  if (!settings.apiBaseUrl || !settings.accessKey || !settings.secretKey) {
    if (allowMock) {
      return {
        baseUrl: settings.h5BaseUrl || "https://openapi-hk.armcloud.net",
        deviceInfo: { padCode, userId },
        expiresIn: 300,
        token: `mock_${crypto.randomBytes(18).toString("base64url")}`
      };
    }

    throw new Error("VMOSCloud API settings are incomplete.");
  }

  const body = JSON.stringify({ padCode });
  const requestUrl = new URL(joinUrl(settings.apiBaseUrl, settings.tokenPath));

  const response = await fetch(requestUrl, {
    method: "POST",
    body,
    headers: vmosSignedHeaders(requestUrl, body, settings.accessKey, settings.secretKey)
  });

  const rawText = await response.text();
  let payload: any = {};
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = { rawText };
  }

  if (!response.ok || (payload?.code && Number(payload.code) !== 200)) {
    throw new Error(payload?.msg || payload?.message || rawText || `VMOS token request failed: ${response.status}`);
  }

  const token = tokenFromPayload(payload);
  if (!token) {
    throw new Error(`VMOS token response did not contain a token: ${rawText}`);
  }

  return {
    baseUrl: settings.h5BaseUrl || "https://openapi-hk.armcloud.net",
    deviceInfo: { padCode, userId },
    expiresIn: Number(payload?.data?.expiresIn || payload?.expiresIn || 300),
    token
  };
}
