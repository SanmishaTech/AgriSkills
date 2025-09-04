'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FullScreenDemoPlayerProps {
  demoUrls: string[];
  onClose: () => void;
  topicId: string;
  demoTitles?: string[];
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const FullScreenDemoPlayer = ({ demoUrls, onClose, topicId, demoTitles }: FullScreenDemoPlayerProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const router = useRouter();
  const playerRef = useRef<any>(null);

  const videoId = demoUrls[currentVideoIndex]?.split('v=')[1]?.split('&')[0];
  const currentTitle = demoTitles?.[currentVideoIndex] || '';

  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (!window.YT) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
        window.onYouTubeIframeAPIReady = initializePlayer;
      } else {
        initializePlayer();
      }
    };

    const initializePlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (videoId && window.YT?.Player) {
        playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                handleNext();
              }
            },
          },
        });
      }
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [currentVideoIndex, videoId]);

  const handleNext = () => {
    if (currentVideoIndex < demoUrls.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    router.push(`/learn-free/1f8c0c20-c51e-43a8-adbd-50654d21e760`);
  };

  if (!demoUrls || demoUrls.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-screen-80 aspect-video">
        <div id={`youtube-player-${videoId}`} className="w-full h-full"></div>

        {/* Top overlay with demo label and title */}
        <div className="absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
          <p className="text-white text-sm md:text-base font-semibold drop-shadow-md line-clamp-2">
            Demo Video {currentVideoIndex + 1}
            {currentTitle ? (
              <span className="font-normal text-white/90">: {currentTitle}</span>
            ) : null}
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
        >
          <X size={24} />
        </button>

        {currentVideoIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
          >
            <ArrowLeft size={32} />
          </button>
        )}

        {currentVideoIndex < demoUrls.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
          >
            <ArrowRight size={32} />
          </button>
        )}

        <button
          onClick={handleSkip}
          className="absolute bottom-4 right-4 text-white bg-green-600 rounded-lg px-4 py-2 hover:bg-green-700 transition-colors font-semibold"
        >
          Skip Demo
        </button>
      </div>
    </div>
  );
};

export default FullScreenDemoPlayer;
