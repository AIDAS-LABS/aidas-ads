import { useEffect, useRef } from "react";

// ReactNativeWebView 타입 선언
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string, targetOrigin?: string) => void;
    };
  }
}

const AnimalRun = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Unity의 OnReceiveMessage(string message) 호출
  const sendPointToUnity = () => {
    // 리워드 지급 ADS 설정 버튼
    const point = 100;

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "sendPointToUnity",
          point: point,
        },
        "*"
      );
    }
    console.log("sendPointToUnity", iframeRef.current);
  };

  useEffect(() => {
    // iframe이 로드된 후 Unity 인스턴스가 준비되면 포인트 전송
    const handleIframeLoad = () => {
      setTimeout(() => {
        sendPointToUnity();
      }, 2000); // Unity 로딩 시간 고려
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener("load", handleIframeLoad);
      }
    };
  }, []);

  const onMessageFromUnity = (event: MessageEvent) => {
    console.log("onMessageFromUnity", event);
    // 유저가 1등 시 Unity에서 메시지를 받았을 때 처리

    if (window?.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "sendPointToUnity",
          point: 100,
        }),
        "*"
      );
    }
    try {
      const message = event.data;
      console.log("message", message);
      if (message.name === "GameFinish") {
        console.log("message", message);
        const { isCorrect } = message.data;
        // 여기서 리워드 지급 API 호출
        console.log(`게임 종료! 정답 여부: ${isCorrect}`);
      }
    } catch (e) {
      console.warn("Unity 메시지 파싱 실패:", e);
    }
  };

  useEffect(() => {
    // Unity로부터 메시지 수신
    window.addEventListener("message", onMessageFromUnity);

    return () => {
      window.removeEventListener("message", onMessageFromUnity);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <iframe
        ref={iframeRef}
        src="http://aidas-game.s3-website.ap-northeast-2.amazonaws.com"
        style={{
          flex: 1,
          border: "none",
          width: "100vw",
          height: "100vh",
        }}
        title="Unity Game"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      <button
        onClick={sendPointToUnity}
        style={{
          padding: "16px",
          backgroundColor: "#009FB7",
          color: "white",
          border: "none",
          borderRadius: "8px",
          margin: "16px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        Send Point to Unity
      </button>
    </div>
  );
};

export default AnimalRun;
