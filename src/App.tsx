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
  const containerRef = useRef<HTMLDivElement>(null);
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
            }
          },
        },
      });
    }
  }, [videoId, onFinish]);

  // 사용자 클릭으로 재생 시작
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
    <>
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
      </div>

      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "transparent",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={handleStartPlayback}
      >
        {!hasStarted && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
                textAlign: "center",
                padding: "20px",
              }}
            >
              클릭하여 재생 시작
            </div>
          </div>
        )}

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
    </>
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
