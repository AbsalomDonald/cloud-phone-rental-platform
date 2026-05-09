"use client";

import { useId, useRef, useState } from "react";

type CloudPhoneConnectorProps = {
  apiPath: string;
  labels: {
    connect: string;
    connecting: string;
    disconnected: string;
    disconnect: string;
    reconnect: string;
    rotate: string;
    sdkMissing: string;
    tokenReady: string;
    viewTitle: string;
    viewDesc: string;
  };
};

type TokenPayload = {
  baseUrl: string;
  deviceInfo: {
    padCode: string;
    userId: string;
  };
  token: string;
};

type ArmcloudModule = {
  ArmcloudEngine?: new (params: Record<string, unknown>) => {
    isSupported?: () => boolean;
    start?: () => void;
    stop?: () => void;
  };
};

async function loadSdk(): Promise<ArmcloudModule | null> {
  const windowWithSdk = window as typeof window & ArmcloudModule;
  if (windowWithSdk.ArmcloudEngine) {
    return { ArmcloudEngine: windowWithSdk.ArmcloudEngine };
  }

  try {
    const importFromUrl = new Function("url", "return import(url)") as (url: string) => Promise<ArmcloudModule>;
    return await importFromUrl("/vendor/armcloud/index.es.js");
  } catch {
    return null;
  }
}

export function CloudPhoneConnector({ apiPath, labels }: CloudPhoneConnectorProps) {
  const [status, setStatus] = useState(labels.disconnected);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const engineRef = useRef<Awaited<ReturnType<typeof loadSdk>> extends { ArmcloudEngine?: new (...args: any[]) => infer T } ? T : any>(null);
  const viewId = `cloud-phone-${useId().replace(/:/g, "")}`;

  async function start() {
    setError("");
    setConnected(false);
    setStatus(labels.connecting);

    const response = await fetch(apiPath, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload?.error || labels.disconnected);
      setStatus(labels.disconnected);
      return;
    }

    setStatus(labels.tokenReady);
    const sdk = await loadSdk();
    const ArmcloudEngine = sdk?.ArmcloudEngine;
    if (!ArmcloudEngine) {
      setError(labels.sdkMissing);
      return;
    }

    const tokenPayload = payload as TokenPayload;
    const engine = new ArmcloudEngine({
      baseUrl: tokenPayload.baseUrl,
      token: tokenPayload.token,
      viewId,
      
      enableControl: true,    
 
      enableMicrophone: false,
      enableCamera: false,
    
      retryCount: 2,
      retryTime: 2000,
    
    deviceInfo: {
      ...tokenPayload.deviceInfo,
    
      autoRecoveryTime: 300,
    
      keyboard: "pad",
    
      mediaType: 3,
    
      rotateType: 0,
    
      controlAble: true,
      keyboardEnable: true,
      mouseEnable: true,
    
      videoStream: {
        resolution: 12,
        frameRate: 2,
        bitrate: 3
      }
    },
    
      callbacks: {
        onConnectFail: ({ code, msg }: { code?: number; msg?: string }) => {
          console.error("VMOS onConnectFail:", code, msg);
          setConnected(false);
          setError(msg || labels.disconnected);
        },
        onConnectSuccess: () => {
          console.log("VMOS connected");
          setConnected(true);
          setStatus(labels.connect);
        },
        onInit: ({ code, msg }: { code: number; msg?: string }) => {
          console.log("VMOS onInit:", code, msg);
          if (code !== 0) {
            setError(msg || labels.disconnected);
            return;
          }
          engine.start?.();
        },
        onErrorMessage: (event: any) => {
          console.error("VMOS onErrorMessage:", event);
        },
        onRenderedFirstFrame: () => {
          console.log("VMOS first frame rendered");
        }
      }
    });

    engineRef.current = engine;
  }

  function stop() {
    engineRef.current?.stop?.();
    setConnected(false);
    setStatus(labels.disconnected);
  }

  return (
    <div className="phone-connector">
      <div className="phone-controlbar">
        <div>
          <strong>{labels.viewTitle}</strong>
          <span className="small-muted"> {status}</span>
        </div>
        <div className="button-row" style={{ marginTop: 0 }}>
          <button className="secondary-button" onClick={stop} type="button">
            {labels.disconnect}
          </button>
          <button className="secondary-button" onClick={start} type="button">
            {labels.reconnect}
          </button>
          <button className="secondary-button" type="button">
            {labels.rotate}
          </button>
          <button className="primary-button" onClick={start} type="button">
            {labels.connect}
          </button>
        </div>
      </div>
      <section className="h5-view">
      <div className="h5-sdk-stage">
        {!connected && (
          <div className="phone-placeholder">
            <h2>{labels.viewTitle}</h2>
            <p className="small-muted">{error || labels.viewDesc}</p>
          </div>
        )}
    
        <div id={viewId} className="phone-render-layer" />
      </div>
    </section>
    </div>
  );
}
