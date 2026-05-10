"use client";

import { Grid3X3, Home, Maximize2, Minimize2, RotateCw, Smartphone, StepBack, Volume1, Volume2, Wifi } from "lucide-react";
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

type ArmcloudEngineInstance = {
  decreaseVolume?: () => void;
  executeAdbCommand?: (command: string) => void;
  increaseVolume?: () => void;
  reshapeWindow?: () => void;
  setPhoneRotation?: (type: number) => void;
  start?: () => void;
  stop?: () => void;
  triggerKeyboardShortcut?: (metaState: number | string, actionKey: number | string, forwardOff?: boolean) => void;
};

type ArmcloudModule = {
  ArmcloudEngine?: {
    isSupported?: () => boolean | Promise<boolean>;
    new (params: Record<string, unknown>): ArmcloudEngineInstance;
  };
};

const phoneSize = {
  aspect: 9 / 19.5,
  maxWidth: 430,
  navHeight: 38
};

const toolText = {
  adjust: "\u8abf\u6574",
  adjustTitle: "\u753b\u9762\u8abf\u6574",
  back: "\u623b\u308b",
  fullscreen: "\u5168\u753b\u9762",
  home: "\u30db\u30fc\u30e0",
  recent: "\u5c65\u6b74",
  reconnect: "\u518d\u63a5\u7d9a",
  rotate: "\u56de\u8ee2",
  volumeDown: "\u97f3\u91cf-",
  volumeUp: "\u97f3\u91cf+",
  windowed: "\u901a\u5e38\u8868\u793a"
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
  const [fullscreen, setFullscreen] = useState(false);
  const [inlineFullscreen, setInlineFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState({ height: 612, navHeight: 38, width: 300 });
  const engineRef = useRef<ArmcloudEngineInstance | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const viewId = `cloud-phone-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    function updateFit() {
      const isFullscreen = Boolean(document.fullscreenElement) || inlineFullscreen;
      const narrow = window.innerWidth <= 720;
      const railWidth = narrow ? 46 : 58;
      const gap = narrow ? 6 : 10;
      const horizontalPadding = isFullscreen ? 16 : narrow ? 14 : 36;
      const verticalChrome = isFullscreen ? 16 : narrow ? 84 : 170;
      const availableWidth = Math.max(260, window.innerWidth - horizontalPadding - railWidth - gap);
      const navHeight = phoneSize.navHeight;
      const availableHeight = Math.max(360, window.innerHeight - verticalChrome - navHeight);
      const maxWidth = isFullscreen ? 520 : phoneSize.maxWidth;
      let width = Math.min(maxWidth, availableWidth);
      let height = Math.round(width / phoneSize.aspect);

      if (height > availableHeight) {
        height = availableHeight;
        width = Math.round(height * phoneSize.aspect);
      }

      setFullscreen(isFullscreen);
      setFit({
        height,
        navHeight,
        width
      });
      window.setTimeout(() => engineRef.current?.reshapeWindow?.(), 80);
    }

    updateFit();
    window.addEventListener("resize", updateFit);
    document.addEventListener("fullscreenchange", updateFit);
    return () => {
      window.removeEventListener("resize", updateFit);
      document.removeEventListener("fullscreenchange", updateFit);
    };
  }, [inlineFullscreen]);

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
      toolsWidth: 0,
      viewId,

      enableControl: true,
      enableMicrophone: false,
      enableCamera: false,

      retryCount: 2,
      retryTime: 2000,

      deviceInfo: {
        ...tokenPayload.deviceInfo,
        autoRecoveryTime: 300,
        controlAble: true,
        keyboard: "pad",
        keyboardEnable: true,
        mediaType: 3,
        mouseEnable: true,
        rotateType: 0,
        videoStream: {
          bitrate: 3,
          frameRate: 2,
          resolution: 12
        }
      },

      callbacks: {
        onChangeRotate: () => {},
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
          scheduleReshape();
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
        onConnectionStateChanged: (event: any) => {
          console.log("VMOS onConnectionStateChanged:", event);
          if (event?.msg && event?.state === 5) {
            setError(event.msg);
          }
        },
        onErrorMessage: (event: any) => {
          console.error("VMOS onErrorMessage:", event);
          if (event?.msg) {
            setError(event.msg);
          }
        },
        onRenderedFirstFrame: () => {
          console.log("VMOS first frame rendered");
          scheduleReshape();
        }
      }
    });

    engineRef.current = engine;
    scheduleReshape();
  }

  function scheduleReshape() {
    for (const delay of [60, 180, 420, 900]) {
      window.setTimeout(() => {
        engineRef.current?.reshapeWindow?.();
        engineRef.current?.setPhoneRotation?.(rotation);
      }, delay);
    }
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

  async function toggleFullscreen() {
    if (document.fullscreenElement || inlineFullscreen) {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setInlineFullscreen(false);
      return;
    }

    try {
      await workspaceRef.current?.requestFullscreen();
    } catch {
      setInlineFullscreen(true);
    }
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
          <button className="secondary-button" onClick={toggleFullscreen} type="button">
            {fullscreen ? toolText.windowed : toolText.fullscreen}
          </button>
          <button className="primary-button" onClick={start} type="button">
            {labels.connect}
          </button>
        </div>
      </div>
      <section
        className={`h5-view ${inlineFullscreen ? "is-inline-fullscreen" : ""}`}
        style={{
          "--phone-fit-height": `${fit.height}px`,
          "--phone-fit-width": `${fit.width}px`,
          "--phone-nav-height": `${fit.navHeight}px`
        } as React.CSSProperties}
      >
        <div className="h5-phone-workspace" ref={workspaceRef}>
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
            {connected && (
              <div className="android-nav-bar" aria-label="Android navigation controls">
                <button aria-label="Back" onClick={() => sendAndroidKey(158, 4)} title={toolText.back} type="button">
                  <StepBack size={22} />
                </button>
                <button aria-label="Home" onClick={() => sendAndroidKey(172, 3)} title={toolText.home} type="button">
                  <Home size={22} />
                </button>
                <button aria-label="Recent apps" onClick={() => sendAndroidKey(139, 187)} title={toolText.recent} type="button">
                  <Grid3X3 size={22} />
                </button>
              </div>
            )}
          </div>
          {connected && (
            <div className="cloud-tool-rail" aria-label="Cloud phone tools">
              <button onClick={start} title={toolText.reconnect} type="button"><Wifi size={22} /><span>{toolText.reconnect}</span></button>
              <button onClick={() => sendAndroidKey(158, 4)} title={toolText.back} type="button"><StepBack size={22} /><span>{toolText.back}</span></button>
              <button onClick={() => sendAndroidKey(172, 3)} title={toolText.home} type="button"><Home size={22} /><span>{toolText.home}</span></button>
              <button onClick={() => engineRef.current?.increaseVolume?.()} title={toolText.volumeUp} type="button"><Volume2 size={22} /><span>{toolText.volumeUp}</span></button>
              <button onClick={() => engineRef.current?.decreaseVolume?.()} title={toolText.volumeDown} type="button"><Volume1 size={22} /><span>{toolText.volumeDown}</span></button>
              <button onClick={rotatePhone} title={toolText.rotate} type="button"><RotateCw size={22} /><span>{toolText.rotate}</span></button>
              <button onClick={() => sendAndroidKey(139, 187)} title={toolText.recent} type="button"><Smartphone size={22} /><span>{toolText.recent}</span></button>
              <button onClick={() => engineRef.current?.reshapeWindow?.()} title={toolText.adjustTitle} type="button"><Grid3X3 size={22} /><span>{toolText.adjust}</span></button>
              <button onClick={toggleFullscreen} title={fullscreen ? toolText.windowed : toolText.fullscreen} type="button">
                {fullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                <span>{fullscreen ? toolText.windowed : toolText.fullscreen}</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
