'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, Search, BookOpen, Play, Globe, Menu, Smile, ArrowRight, X, Heart, MessageCircle, Share, MoreVertical, Pause, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { LanguageIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

export default function HomePage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('home');

  const circularMenuItems = [
    { id: 1, label: 'ENGAGE', color: '#22c55e', icon: '👥' },
    { id: 2, label: 'FOOD', color: '#eab308', icon: '🍽️' },
    { id: 3, label: 'TRADE', color: '#f97316', icon: '📊' },
    { id: 4, label: 'LEARN', color: '#3b82f6', icon: '📚' },
    { id: 5, label: 'PROFIT', color: '#a855f7', icon: '💰' },
    { id: 6, label: 'TECH', color: '#ec4899', icon: '💻' },
  ];

  const [selectedShort, setSelectedShort] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  
  // Video player state management
  const VideoPlayer = ({ video }) => {
    const [playerState, setPlayerState] = useState('paused');
    const playerRef = useRef(null);
    const iframeId = `youtube-player-${video.id}`;
    
    useEffect(() => {
      // Load YouTube IFrame API
      if (!window.YT) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
        
        window.onYouTubeIframeAPIReady = () => {
          initializePlayer();
        };
      } else {
        initializePlayer();
      }
      
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }, []);
    
    const initializePlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(iframeId, {
          height: '100%',
          width: '100%',
          videoId: video.youtubeId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 1,
            playsinline: 1
          },
          events: {
            onReady: (event) => {
              setPlayerState('playing');
              event.target.playVideo();
            },
            onStateChange: (event) => {
              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  setPlayerState('playing');
                  break;
                case window.YT.PlayerState.PAUSED:
                  setPlayerState('paused');
                  break;
                case window.YT.PlayerState.ENDED:
                  setPlayerState('ended');
                  break;
                default:
                  break;
              }
            }
          }
        });
      }
    };
    
    const togglePlayPause = () => {
      if (playerRef.current) {
        if (playerState === 'playing') {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      }
    };
    
    const restartVideo = () => {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      }
    };
    
    return (
      <div className="relative w-full h-full">
        <div id={iframeId} className="w-full h-full"></div>
        
        {/* Transparent overlay to prevent iframe from capturing events */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {/* Controls container with pointer events enabled */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-8" style={{ pointerEvents: 'auto' }}>
              {/* Restart Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  restartVideo();
                }}
                className="relative bg-black/60 active:bg-black/80 text-white rounded-full transition-all duration-200 transform active:scale-95"
                style={{ 
                  padding: '18px',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  zIndex: 10
                }}
              >
                <RotateCcw className="w-8 h-8 pointer-events-none" />
              </button>
              
              {/* Play/Pause Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="relative bg-black/60 active:bg-black/80 text-white rounded-full transition-all duration-200 transform active:scale-95"
                style={{ 
                  padding: '24px',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  zIndex: 10
                }}
              >
                {playerState === 'playing' ? (
                  <Pause className="w-10 h-10 pointer-events-none" />
                ) : (
                  <Play className="w-10 h-10 pointer-events-none" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const videos = [
    {
      id: 1,
      title: 'Natural Pest Control Methods for Organic Farming',
      duration: '0:45',
      instructor: 'Organic Farming Hub',
      youtubeId: 'bYIhwrHHo3w', // YouTube Shorts ID
      shortsUrl: 'https://www.youtube.com/shorts/bYIhwrHHo3w',
      views: '2.3K',
      timeAgo: '3 days ago'
    },
    {
      id: 2,
      title: 'Complete Guide to Vegetable Packaging',
      duration: '0:58',
      instructor: 'Farm Business Tips',
      youtubeId: 'L0_B0VLzqeI', // YouTube Shorts ID
      shortsUrl: 'https://www.youtube.com/shorts/L0_B0VLzqeI',
      views: '1.8K',
      timeAgo: '1 week ago'
    },
    {
      id: 3,
      title: 'Urban Vegetable Growing Techniques',
      duration: '0:32',
      instructor: 'Urban Gardener',
      youtubeId: 'mbOdXk6to_o', // YouTube Shorts ID
      shortsUrl: 'https://www.youtube.com/shorts/mbOdXk6to_o',
      views: '4.1K',
      timeAgo: '5 days ago'
    },
  ];

  const openShort = (video) => {
    setSelectedShort(video);
  };

  const closeShort = () => {
    setSelectedShort(null);
  };

  const calculatePosition = (index: number, total: number) => {
    const angle = (index * 360) / total - 90; // Start from top
    const radius = 120;
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);
    return { x, y };
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col w-full relative overflow-hidden">
      
      <header className="text-white py-2 px-3 md:py-4 md:px-6 lg:py-5 lg:px-8 flex items-center justify-between flex-shrink-0"
        style={{
          background: 'linear-gradient(to bottom, #008C45 50%, #00B68A 100%)'
        }}
      >
      
        <div className="flex items-center space-x-1.5 md:space-x-2 lg:space-x-2.5 xl:space-x-3 2xl:space-x-3.5">
          <Image 
            src="/images/logo.png" 
            alt="AgriSkills Logo" 
            width={52}
            height={52}
            className="object-contain [filter:drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 2xl:w-11 2xl:h-11"
          />
          <h1 className="hidden md:block md:text-sm lg:text-base xl:text-lg 2xl:text-xl font-bold whitespace-nowrap">AgriSkills</h1>
        </div>
        
        {/* Navigation items for floating navbar on larger screens */}
        <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
          <button
            onClick={() => setActiveNav('home')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${activeNav === 'home' ? 'text-yellow-200 bg-white/10' : 'text-white hover:text-yellow-200'}`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveNav('search')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${activeNav === 'search' ? 'text-yellow-200 bg-white/10' : 'text-white hover:text-yellow-200'}`}
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Search</span>
          </button>
          <button
            onClick={() => setActiveNav('learn')}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${activeNav === 'learn' ? 'text-yellow-200 bg-white/10' : 'text-white hover:text-yellow-200'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Learn</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 md:space-x-2 lg:space-x-2.5 xl:space-x-3 2xl:space-x-3.5">
          <h1 className="text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg font-bold tracking-wider whitespace-nowrap">LOGIN/ SIGN UP</h1>
        
          <div className="bg-yellow-200 rounded-md p-0.5 flex items-center border border-transparent">
            <button 
              className="bg-transparent text-black p-0.5 md:p-1 lg:p-1 rounded-l hover:bg-black/10 transition-colors"
              title="Language Translator"
              onClick={() => alert('Language translator feature coming soon!')}
            >
              <LanguageIcon className="h-3 w-3 md:h-4 md:w-4 lg:h-4 lg:w-4" />
            </button>
            <div className="w-px h-3 md:h-4 lg:h-4 bg-gray-500/50"></div>
            <button 
              className="bg-transparent text-black p-0.5 md:p-1 lg:p-1 rounded-r hover:bg-black/10 transition-colors"
              title="Help & Support"
              onClick={() => alert('Help & Support section coming soon!')}
            >
              <QuestionMarkCircleIcon className="h-3 w-3 md:h-4 md:w-4 lg:h-4 lg:w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide">
         

        <motion.div 
          className="relative group cursor-pointer mx-4 md:mx-6 lg:mx-8 xl:mx-12 2xl:mx-16 mt-6 md:mt-8 lg:mt-6 h-60 md:h-72 lg:h-96 xl:h-[28rem] 2xl:h-[32rem] rounded-xl overflow-hidden shadow-lg bg-gray-900"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/learn-more')}
        >
          <Image
            src="/images/image1.png"
            alt="Sustainable Farming Techniques"
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-110 transition-transform duration-500 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 flex flex-col justify-end">
            <h3 className="text-white text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold">Master Sustainable Farming</h3>
            <p className="text-gray-300 mt-1 md:mt-2 text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl">Unlock the secrets to a greener, more profitable harvest.</p>
            <div className="flex items-center mt-3 md:mt-4 lg:mt-5 text-green-400 font-semibold text-xs md:text-sm lg:text-base xl:text-lg">
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ml-1 md:ml-2 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        <div className="px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pb-24">
          <div className="flex justify-between items-center mb-4 md:mb-5 lg:mb-6 xl:mb-8">
            <h2 className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold">Videos</h2>
            <button className="text-green-600 text-xs md:text-sm lg:text-base xl:text-lg font-medium hover:text-green-700 transition-colors">View More</button>
          </div>

          {/* Mobile: Horizontal scroll, Desktop: Grid */}
          <div className="sm:hidden">
            <div className="flex overflow-x-auto gap-3 px-1 pb-2 scrollbar-hide snap-x snap-mandatory">
              {videos.map((video) => (
                <motion.div
                  key={video.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-36 h-52 snap-start"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openShort(video)}
                >
                  {/* YouTube Thumbnail */}
                  <div className="relative w-full aspect-video bg-black overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}?controls=1&modestbranding=1&rel=0`}
                      title={video.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
                      {video.duration}
                    </div>
                  </div>
                  
                  {/* Video info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                      {video.title}
                    </h3>
                    <div className="flex items-center text-gray-600 text-xs mb-1">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs font-medium">{video.instructor.charAt(0)}</span>
                      </div>
                      <span className="truncate">{video.instructor}</span>
                    </div>
                    <div className="text-gray-500 text-xs leading-tight">
                      <span>{video.views} views</span> · <span>{video.timeAgo}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group w-full"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openShort(video)}
              >
                {/* YouTube Thumbnail */}
                <div className="relative w-full aspect-video bg-black overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}?controls=1&modestbranding=1&rel=0`}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                  
                  {/* Duration badge */}
                  <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs pointer-events-none">
                    {video.duration}
                  </div>
                </div>
                
                {/* Video info */}
                <div className="p-2.5 sm:p-3">
                  <h3 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                    {video.title}
                  </h3>
                  <div className="flex items-center text-gray-600 text-[10px] sm:text-xs lg:text-sm mb-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-full flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                      <span className="text-[8px] sm:text-xs font-medium">{video.instructor.charAt(0)}</span>
                    </div>
                    <span className="truncate">{video.instructor}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] sm:text-xs leading-tight">
                    <span>{video.views} views</span> · <span>{video.timeAgo}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex-shrink-0"
        style={{
          '@media (min-width: 751px)': {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            borderRadius: '50px',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            background: 'rgba(255,255,255,0.95)'
          }
        }}
      >
        <div className="flex justify-center lg:justify-center items-center py-2 md:py-3 lg:py-2 xl:py-3 md:px-8 lg:px-12 md:gap-6 lg:gap-8">
          <button
            onClick={() => setActiveNav('home')}
            className={`lg:hidden flex flex-col items-center p-1 md:p-2 lg:p-3 xl:p-4 transition-colors ${activeNav === 'home' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Home className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
            <span className="text-[8px] md:text-[10px] lg:text-xs xl:text-sm mt-1 font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveNav('search')}
            className={`lg:hidden flex flex-col items-center p-1 md:p-2 lg:p-3 xl:p-4 transition-colors ${activeNav === 'search' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Search className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
            <span className="text-[8px] md:text-[10px] lg:text-xs xl:text-sm mt-1 font-medium">Search</span>
          </button>
          <button
            onClick={() => setActiveNav('learn')}
            className={`flex flex-col items-center p-1 md:p-2 lg:p-3 xl:p-4 transition-colors ${activeNav === 'learn' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
            <span className="text-[8px] md:text-[10px] lg:text-xs xl:text-sm mt-1 font-medium">Learn</span>
          </button>
        </div>
      </nav>

      {/* YouTube Shorts Modal */}
      {selectedShort && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeShort}
        >
          <div className="relative w-full h-full max-w-sm mx-auto bg-black" onClick={(e) => e.stopPropagation()}>
            {/* Close button - Fixed touch target */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeShort();
              }}
              className="absolute top-4 left-4 bg-black/60 active:bg-black/80 text-white rounded-full transition-colors"
              style={{ 
                padding: '0px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                userSelect: 'none',
                zIndex: 30
              }}
            >
              <X className="w-8 h-8 pointer-events-none" />
            </button>

            {/* Video player */}
            <div className="relative w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${selectedShort.youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                title={selectedShort.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>


              {/* Bottom info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-700">{selectedShort.instructor.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{selectedShort.instructor}</p>
                    <p className="text-gray-300 text-xs">{selectedShort.views} views · {selectedShort.timeAgo}</p>
                  </div>
                  
                </div>
                {/* <h3 className="text-white font-semibold text-sm mb-2 leading-tight">
                  {selectedShort.title}
                </h3> */}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
