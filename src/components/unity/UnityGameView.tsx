import React, { useEffect, useRef } from "react";
import "./UnityGameView.css";

interface UnityConfig {
  arguments: string[];
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string;
  companyName: string;
  productName: string;
  productVersion: string;
  showBanner: (msg: string, type: string) => void;
}

interface UnityInstance {
  SetFullscreen: (fullscreen: number) => void;
  Quit: () => void;
}

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: UnityConfig,
      progressCallback?: (progress: number) => void
    ) => Promise<UnityInstance>;
  }
}

export default function UnityGameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unityInstanceRef = useRef<UnityInstance | null>(null);

  useEffect(() => {
    const loadUnityGame = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;

      // Unity 로딩 바 표시
      const loadingBar = document.getElementById("unity-loading-bar");
      if (loadingBar) {
        loadingBar.style.display = "block";
      }

      // Unity 설정
      const buildUrl = "/unity/Build";
      const config = {
        arguments: [],
        dataUrl: buildUrl + "/unity_game.data.br",
        frameworkUrl: buildUrl + "/unity_game.framework.js.br",
        codeUrl: buildUrl + "/unity_game.wasm.br",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "DefaultCompany",
        productName: "Racing_Prototype",
        productVersion: "1.0",
        showBanner: unityShowBanner,
      };

      try {
        // Unity 로더 스크립트 로드
        const loaderUrl = buildUrl + "/unity_game.loader.js";
        await loadScript(loaderUrl);

        // Unity 인스턴스 생성
        if (window.createUnityInstance) {
          unityInstanceRef.current = await window.createUnityInstance(
            canvas,
            config,
            (progress: number) => {
              const progressBar = document.getElementById(
                "unity-progress-bar-full"
              );
              if (progressBar) {
                progressBar.style.width = 100 * progress + "%";
              }
            }
          );

          // 로딩 바 숨기기
          if (loadingBar) {
            loadingBar.style.display = "none";
          }

          // 전체화면 버튼 이벤트 설정
          const fullscreenButton = document.getElementById(
            "unity-fullscreen-button"
          );
          if (fullscreenButton) {
            fullscreenButton.onclick = () => {
              unityInstanceRef.current.SetFullscreen(1);
            };
          }
        }
      } catch (error) {
        console.error("Unity 로드 실패:", error);
        alert("Unity 게임을 로드하는 중 오류가 발생했습니다.");
      }
    };

    // 스크립트 로드 함수
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
        document.body.appendChild(script);
      });
    };

    // 경고/에러 메시지 표시 함수
    const unityShowBanner = (msg: string, type: string) => {
      const warningBanner = document.getElementById("unity-warning");
      if (!warningBanner) return;

      const updateBannerVisibility = () => {
        warningBanner.style.display = warningBanner.children.length
          ? "block"
          : "none";
      };

      const div = document.createElement("div");
      div.innerHTML = msg;
      warningBanner.appendChild(div);

      if (type === "error") {
        div.style.cssText = "background: red; padding: 10px;";
      } else if (type === "warning") {
        div.style.cssText = "background: yellow; padding: 10px;";
        setTimeout(() => {
          if (warningBanner.contains(div)) {
            warningBanner.removeChild(div);
            updateBannerVisibility();
          }
        }, 5000);
      }
      updateBannerVisibility();
    };

    // 모바일 디바이스 체크 및 스타일 적용
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content =
        "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes";
      document.getElementsByTagName("head")[0].appendChild(meta);

      const container = document.getElementById("unity-container");
      if (container) {
        container.className = "unity-mobile";
      }
      if (canvasRef.current) {
        canvasRef.current.className = "unity-mobile";
      }
    } else {
      // 데스크톱 스타일
      if (canvasRef.current) {
        canvasRef.current.style.width = "1280px";
        canvasRef.current.style.height = "720px";
      }
    }

    loadUnityGame();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit();
      }
    };
  }, []);

  return (
    <div id="unity-container" className="unity-desktop">
      <canvas
        ref={canvasRef}
        id="unity-canvas"
        width={1280}
        height={720}
        tabIndex={-1}
      />
      <div id="unity-loading-bar">
        <div id="unity-logo"></div>
        <div id="unity-progress-bar-empty">
          <div id="unity-progress-bar-full"></div>
        </div>
      </div>
      <div id="unity-warning"></div>
      <div id="unity-footer">
        <div id="unity-logo-title-footer"></div>
        <div id="unity-fullscreen-button"></div>
        <div id="unity-build-title">Racing_Prototype</div>
      </div>
    </div>
  );
}
