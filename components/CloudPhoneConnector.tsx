"use client";

import { Grid3X3, Home, RotateCw, Smartphone, StepBack, Volume1, Volume2, Wifi } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

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
  ArmcloudEngine?: {
    isSupported?: () => boolean | Promise<boolean>;
    new (params: Record<string, unknown>): {
    executeAdbCommand?: (command: string) => void;
    isSupported?: () => boolean;
    reshapeWindow?: () => void;
    setPhoneRotation?: (type: number) => void;
    start?: () => void;
    stop?: () => void;
    triggerKeyboardShortcut?: (metaState: number | string, actionKey: number | string, forwardOff?: boolean) => void;
    increaseVolume?: () => void;
    decreaseVolume?: () => void;
  };
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
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState({ height: 560, scale: 560 / 696, width: 436 * (560 / 696) });
  const engineRef = useRef<Awaited<ReturnType<typeof loadSdk>> extends { ArmcloudEngine?: new (...args: any[]) => infer T } ? T : any>(null);
  const viewId = `cloud-phone-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    function updateFit() {
      const availableHeight = Math.max(420, window.innerHeight - 250);
      const height = Math.min(560, availableHeight);
      const scale = height / 696;
      setFit({ height, scale, width: 436 * scale });
      window.setTimeout(() => engineRef.current?.reshapeWindow?.(), 80);
    }

    updateFit();
    window.addEventListener("resize", updateFit);
    return () => window.removeEventListener("resize", updateFit);
  }, []);

  async function start() {
    setError("");
    setConnected(false);
    setStatus(labels.connecting);

    let payload: unknown;
    try {
      const response = await fetch(apiPath, { method: "POST" });
      payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError((payload as { error?: string })?.error || labels.disconnected);
        setStatus(labels.disconnected);
        return;
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : labels.disconnected);
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
    const supported = await ArmcloudEngine.isSupported?.();
    if (supported === false) {
      setError(labels.sdkMissing);
      return;
    }

    const tokenPayload = payload as TokenPayload;
    const engine = new ArmcloudEngine({
      baseUrl: tokenPayload.baseUrl,
      token: tokenPayload.token,
      viewId,
      toolsWidth: 56,
      
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
          setStatus(labels.disconnected);
          setError(msg || (code ? `Connection failed (${code})` : labels.disconnected));
        },
        onConnectSuccess: () => {
          console.log("VMOS connected");
          setConnected(true);
          setStatus(labels.connect);
        },
        onInit: ({ code, msg }: { code: number | string; msg?: string }) => {
          console.log("VMOS onInit:", code, msg);
          if (Number(code) !== 0) {
            setStatus(labels.disconnected);
            setError(msg || labels.disconnected);
            return;
          }
          engine.start?.();
        },
        onErrorMessage: (event: any) => {
          console.error("VMOS onErrorMessage:", event);
          if (event?.msg) {
            setError(event.msg);
          }
        },
        onConnectionStateChanged: (event: any) => {
          console.log("VMOS onConnectionStateChanged:", event);
          if (event?.msg && event?.state === 5) {
            setError(event.msg);
          }
        },
        onRenderedFirstFrame: () => {
          console.log("VMOS first frame rendered");
        }
      }
    });

    engineRef.current = engine;
  }

  function sendAndroidKey(sdkKeyCode: number, adbKeyCode: number) {
    const engine = engineRef.current;
    engine?.triggerKeyboardShortcut?.(0, sdkKeyCode);
    engine?.executeAdbCommand?.(`input keyevent ${adbKeyCode}`);
  }

  function rotatePhone() {
    const nextRotation = rotation === 0 ? 1 : 0;
    setRotation(nextRotation);
    engineRef.current?.setPhoneRotation?.(nextRotation);
    window.setTimeout(() => engineRef.current?.reshapeWindow?.(), 120);
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
          <button className="secondary-button" onClick={rotatePhone} type="button">
            {labels.rotate}
          </button>
          <button className="primary-button" onClick={start} type="button">
            {labels.connect}
          </button>
        </div>
      </div>
      <section
        className="h5-view"
        style={{
          "--phone-fit-height": `${fit.height}px`,
          "--phone-fit-width": `${fit.width}px`,
          "--phone-scale": String(fit.scale)
        } as React.CSSProperties}
      >
        <div className="h5-phone-workspace">
          <div className="h5-phone-column">
            <div className="h5-sdk-stage">
              <div className="phone-screen-area">
                {!connected && (
                  <div className="phone-placeholder">
                    <h2>{labels.viewTitle}</h2>
                    <p className="small-muted">{error || labels.viewDesc}</p>
                  </div>
                )}

                <div id={viewId} className="phone-render-layer" />
              </div>
            </div>
          </div>
          {connected && (
            <div className="cloud-tool-rail" aria-label="Cloud phone tools">
              <button onClick={start} title="重连" type="button"><Wifi size={22} /><span>重连</span></button>
              <button onClick={() => sendAndroidKey(158, 4)} title="返回" type="button"><StepBack size={22} /><span>返回</span></button>
              <button onClick={() => sendAndroidKey(172, 3)} title="主页" type="button"><Home size={22} /><span>主页</span></button>
              <button onClick={() => engineRef.current?.increaseVolume?.()} title="音量+" type="button"><Volume2 size={22} /><span>音量+</span></button>
              <button onClick={() => engineRef.current?.decreaseVolume?.()} title="音量-" type="button"><Volume1 size={22} /><span>音量-</span></button>
              <button onClick={rotatePhone} title="旋转" type="button"><RotateCw size={22} /><span>旋转</span></button>
              <button onClick={() => sendAndroidKey(139, 187)} title="多任务" type="button"><Smartphone size={22} /><span>多任务</span></button>
              <button onClick={() => engineRef.current?.reshapeWindow?.()} title="适配画面" type="button"><Grid3X3 size={22} /><span>适配</span></button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
