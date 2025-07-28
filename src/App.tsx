import React, { useEffect, useRef, useState } from "react";

// 유튜브 URL에서 비디오 ID를 추출하는 함수
const extractVideoId = (url: string): string | null => {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    console.error("유튜브 URL 파싱 오류:", error);
    return null;
  }
};

interface YouTubePlayerProps {
  videoUrl: string;
  onFinish: () => void;
}

// YouTube Player 타입 정의
interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoUrl,
  onFinish,
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const videoId = extractVideoId(videoUrl);

  // YouTube Player API 로드
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        if (playerRef.current && videoId) {
          playerInstanceRef.current = new window.YT.Player(playerRef.current, {
            height: "100%",
            width: "100%",
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              loop: 0,
              mute: 0,
              playsinline: 1,
              fs: 0,
              iv_load_policy: 3,
              showinfo: 0,
              disablekb: 1,
            },
            events: {
              onReady: () => {
                console.log("플레이어 준비 완료");
              },
              onStateChange: (event: { data: number }) => {
                if (event.data === window.YT.PlayerState.ENDED) {
                  setIsFinished(true);
                  onFinish();
                  // 웹뷰에 완료 메시지 전송
                  window.parent.postMessage("videoCompleted", "*");
                  alert("시청 완료! 웹뷰에 메시지 전송됨");
                }
              },
            },
          });
        }
      };
    } else {
      playerInstanceRef.current = new window.YT.Player(playerRef.current!, {
        height: "100%",
        width: "100%",
        videoId: videoId!,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          loop: 0,
          mute: 0,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
          showinfo: 0,
          disablekb: 1,
        },
        events: {
          onReady: () => {
            console.log("플레이어 준비 완료");
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setIsFinished(true);
              onFinish();
              // 웹뷰에 완료 메시지 전송
              window.parent.postMessage("videoCompleted", "*");
              alert("시청 완료! 웹뷰에 메시지 전송됨");
            }
          },
        },
      });
    }
  }, [videoId, onFinish]);

  // postMessage 리스너 추가
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("postMessage 받음:", event.data);

      // postMessage 받으면 얼럿 띄우기
      alert("postMessage 받았습니다: " + event.data);

      if (event.data === "startPlayback") {
        console.log("React Native에서 재생 요청 받음");
        alert("재생 시작합니다!");
        handleStartPlayback();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // 재생 시작 함수
  const handleStartPlayback = () => {
    if (playerInstanceRef.current && !hasStarted) {
      setHasStarted(true);
      try {
        if (typeof playerInstanceRef.current.playVideo === "function") {
          playerInstanceRef.current.playVideo();
        } else {
          console.log("playVideo 함수가 아직 준비되지 않음");
          setTimeout(() => {
            if (
              playerInstanceRef.current &&
              typeof playerInstanceRef.current.playVideo === "function"
            ) {
              playerInstanceRef.current.playVideo();
            }
          }, 1000);
        }
      } catch (error) {
        console.error("재생 중 오류:", error);
      }
    }
  };

  if (!videoId) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "18px",
        }}
      >
        유효하지 않은 유튜브 URL입니다.
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
      }}
    >
      <div ref={playerRef} style={{ width: "100%", height: "100%" }} />

      {isFinished && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            backgroundColor: "rgba(230, 255, 230, 0.9)",
            borderRadius: "5px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#006600",
          }}
        >
          ✅ 시청 완료!
        </div>
      )}
    </div>
  );
};

// YouTube API 타입 선언
declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement,
        config: {
          height: string;
          width: string;
          videoId: string;
          playerVars: Record<string, number>;
          events: {
            onReady: () => void;
            onStateChange: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

function App() {
  const handleVideoFinish = () => {
    console.log("동영상 시청이 완료되었습니다!");
  };

  return (
    <YouTubePlayer
      videoUrl="https://www.youtube.com/shorts/z-29NKtciRg"
      onFinish={handleVideoFinish}
    />
  );
}

export default App;
