"use client";

import { Grid3X3, Home, Maximize2, Minimize2, RotateCw, Smartphone, StepBack, Volume1, Volume2, Wifi } from "lucide-react";
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
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [debugLine, setDebugLine] = useState("");
  const engineRef = useRef<Awaited<ReturnType<typeof loadSdk>> extends { ArmcloudEngine?: new (...args: any[]) => infer T } ? T : any>(null);
  const frameSizeRef = useRef({ width: 540, height: 960 });
  const reactId = useId();
  const viewIdRef = useRef(`cloud-phone-${reactId.replace(/:/g, "")}`);
  const viewId = viewIdRef.current;

  function toLogDetails(details: unknown) {
    if (details instanceof HTMLVideoElement) {
      return {
        tag: "video",
        videoWidth: details.videoWidth,
        videoHeight: details.videoHeight,
        readyState: details.readyState,
        paused: details.paused
      };
    }
    if (details instanceof Error) {
      return { name: details.name, message: details.message };
    }
    return details;
  }

  function recordClientEvent(name: string, details?: unknown) {
    const safeDetails = toLogDetails(details);
    let text = "";
    try {
      text = safeDetails ? JSON.stringify(safeDetails) : "";
    } catch {
      text = String(safeDetails);
    }
    const line = `${name}${text ? ` ${text.slice(0, 180)}` : ""}`;
    setDebugLine(line);
    console.log(`VMOS ${name}:`, safeDetails ?? "");
    fetch("/api/client-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, details: text, viewId })
    }).catch(() => {});
  }

  function clearSdkView() {
    const view = document.getElementById(viewId);
    if (view) {
      view.replaceChildren();
      view.removeAttribute("style");
    }
  }

  function fitSdkSurface(frameSize = frameSizeRef.current) {
    const view = document.getElementById(viewId) as HTMLElement | null;
    const screen = view?.closest(".phone-screen-area") as HTMLElement | null;
    if (!view || !screen) {
      return;
    }

    const screenRect = screen.getBoundingClientRect();
    const frameWidth = Math.max(1, frameSize.width || 540);
    const frameHeight = Math.max(1, frameSize.height || 960);
    const scale = Math.min(screenRect.width / frameWidth, screenRect.height / frameHeight);
    const renderWidth = Math.max(1, Math.floor(frameWidth * scale));
    const renderHeight = Math.max(1, Math.floor(frameHeight * scale));

    view.style.width = "100%";
    view.style.height = "100%";
    view.style.left = "0";
    view.style.top = "0";
    view.style.right = "auto";
    view.style.bottom = "auto";
    view.style.transform = "none";

    const sdkRoot = view.firstElementChild as HTMLElement | null;
    if (sdkRoot) {
      sdkRoot.style.width = `${renderWidth}px`;
      sdkRoot.style.height = `${renderHeight}px`;
      sdkRoot.style.maxWidth = "100%";
      sdkRoot.style.maxHeight = "100%";
      sdkRoot.style.flex = "0 0 auto";
      sdkRoot.style.position = "relative";
      sdkRoot.style.overflow = "hidden";
    }

    view.querySelectorAll<HTMLElement>("div").forEach((node) => {
      if (node !== sdkRoot) {
        node.style.width = "100%";
        node.style.height = "100%";
      }
    });

    view.querySelectorAll<HTMLVideoElement | HTMLCanvasElement>("video, canvas").forEach((node) => {
      node.style.width = "100%";
      node.style.height = "100%";
      node.style.objectFit = "contain";
    });
  }

  function normalizeSdkVideo() {
    fitSdkSurface();
    const view = document.getElementById(viewId);
    const video = view?.querySelector("video") as HTMLVideoElement | null;
    if (!video) {
      recordClientEvent("video-missing");
      return;
    }

    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "contain";

    const rect = video.getBoundingClientRect();
    const viewRect = view?.getBoundingClientRect();
    const sdkRootRect = (view?.firstElementChild as HTMLElement | null)?.getBoundingClientRect();
    recordClientEvent("video-probe", {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      view: viewRect
        ? {
            width: Math.round(viewRect.width),
            height: Math.round(viewRect.height)
          }
        : null,
      sdkRoot: sdkRootRect
        ? {
            width: Math.round(sdkRootRect.width),
            height: Math.round(sdkRootRect.height)
          }
        : null,
      rect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    });

    video.play().catch((playError) => {
      recordClientEvent("video-play-failed", playError instanceof Error ? playError.message : String(playError));
    });
  }

  async function start() {
    engineRef.current?.stop?.();
    clearSdkView();
    setError("");
    setConnected(false);
    setHasFirstFrame(false);
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
          recordClientEvent("connect-fail", { code, msg });
          setConnected(false);
          setStatus(labels.disconnected);
          setError(msg || (code ? `Connection failed (${code})` : labels.disconnected));
        },
        onConnectSuccess: () => {
          recordClientEvent("connect-success");
          setConnected(true);
          setStatus(labels.connect);
          window.setTimeout(normalizeSdkVideo, 300);
          window.setTimeout(normalizeSdkVideo, 1200);
        },
        onInit: ({ code, msg }: { code: number | string; msg?: string }) => {
          recordClientEvent("init", { code, msg });
          if (Number(code) !== 0) {
            setStatus(labels.disconnected);
            setError(msg || labels.disconnected);
            return;
          }
          engine.start?.();
        },
        onErrorMessage: (event: any) => {
          recordClientEvent("error-message", event);
          if (event?.msg) {
            setError(event.msg);
          }
        },
        onConnectionStateChanged: (event: any) => {
          recordClientEvent("connection-state", event);
          if (event?.msg && event?.state === 5) {
            setError(event.msg);
          }
        },
        onAutoplayFailed: (event: any) => {
          recordClientEvent("autoplay-failed", event);
          normalizeSdkVideo();
        },
        onVideoInit: (event: any) => {
          recordClientEvent("video-init", event);
          normalizeSdkVideo();
        },
        onVideoError: (event: any) => {
          recordClientEvent("video-error", event);
          setError(event?.message || event?.msg || "Video error");
        },
        onProgress: (event: any) => {
          recordClientEvent("progress", event);
        },
        onChangeResolution: (event: any) => {
          recordClientEvent("resolution", event);
          window.setTimeout(normalizeSdkVideo, 60);
        },
        onChangeRotate: (type: number, size: unknown) => {
          recordClientEvent("rotate-change", { type, size });
          window.setTimeout(normalizeSdkVideo, 60);
        },
        onRenderedFirstFrame: (event: any) => {
          recordClientEvent("first-frame", event);
          if (event?.width && event?.height) {
            frameSizeRef.current = { width: Number(event.width), height: Number(event.height) };
          }
          setHasFirstFrame(true);
          normalizeSdkVideo();
          window.setTimeout(normalizeSdkVideo, 80);
          window.setTimeout(normalizeSdkVideo, 400);
          window.setTimeout(normalizeSdkVideo, 1200);
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
    clearSdkView();
    setConnected(false);
    setHasFirstFrame(false);
    setStatus(labels.disconnected);
  }

  function toggleFullscreen() {
    setFullscreen((value) => !value);
    window.setTimeout(() => {
      engineRef.current?.reshapeWindow?.();
      normalizeSdkVideo();
    }, 80);
  }

  return (
    <div className={`phone-connector${fullscreen ? " phone-connector-fullscreen" : ""}`}>
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
      <section className="h5-view">
        <div className="h5-phone-workspace">
          <div className="h5-phone-column">
            <div className="h5-sdk-stage">
              <div className="phone-screen-area">
                {(!connected || !hasFirstFrame) && (
                  <div className="phone-placeholder">
                    <h2>{labels.viewTitle}</h2>
                    <p className="small-muted">{error || (connected ? "画面を読み込み中..." : labels.viewDesc)}</p>
                    {debugLine && <p className="phone-debug-line">{debugLine}</p>}
                  </div>
                )}

                <div id={viewId} className="phone-render-layer" />
              </div>
            </div>
            {connected && (
              <div className="android-nav-bar" aria-label="Android navigation controls">
                <button aria-label="Back" onClick={() => sendAndroidKey(158, 4)} title="戻る" type="button">
                  <StepBack size={22} />
                </button>
                <button aria-label="Home" onClick={() => sendAndroidKey(172, 3)} title="ホーム" type="button">
                  <Home size={22} />
                </button>
                <button aria-label="Recent apps" onClick={() => sendAndroidKey(139, 187)} title="履歴" type="button">
                  <Grid3X3 size={22} />
                </button>
              </div>
            )}
          </div>
          {connected && (
            <div className="cloud-tool-rail" aria-label="Cloud phone tools">
              <button onClick={start} title="再接続" type="button"><Wifi size={22} /><span>再接続</span></button>
              <button onClick={() => sendAndroidKey(158, 4)} title="戻る" type="button"><StepBack size={22} /><span>戻る</span></button>
              <button onClick={() => sendAndroidKey(172, 3)} title="ホーム" type="button"><Home size={22} /><span>ホーム</span></button>
              <button onClick={() => engineRef.current?.increaseVolume?.()} title="音量+" type="button"><Volume2 size={22} /><span>音量+</span></button>
              <button onClick={() => engineRef.current?.decreaseVolume?.()} title="音量-" type="button"><Volume1 size={22} /><span>音量-</span></button>
              <button onClick={rotatePhone} title="回転" type="button"><RotateCw size={22} /><span>回転</span></button>
              <button onClick={() => sendAndroidKey(139, 187)} title="履歴" type="button"><Smartphone size={22} /><span>履歴</span></button>
              <button onClick={() => engineRef.current?.reshapeWindow?.()} title="調整" type="button"><Grid3X3 size={22} /><span>調整</span></button>
              <button onClick={toggleFullscreen} title={fullscreen ? "通常表示" : "全画面"} type="button">
                {fullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                <span>{fullscreen ? "通常表示" : "全画面"}</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
