'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, Search, BookOpen, Play, Globe, Menu, Smile, ArrowRight, X, Heart, MessageCircle, Share, MoreVertical, Pause, RotateCcw, Mic } from 'lucide-react';
import Image from 'next/image';
import { LanguageIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { getProcessedVideos } from '@/config/youtube-videos';

// Type definitions
interface Video {
  id: number;
  youtubeId: string;
  title: string;
  duration: string;
  instructor: string;
  views: string;
  timeAgo: string;
  shortsUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
}

interface Subtopic {
  id: string;
  title: string;
  _count?: {
    courses: number;
  };
}

interface Topic {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subtopics: Subtopic[];
  _count: {
    subtopics: number;
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subtopics: Subtopic[];
  _count: {
    subtopics: number;
  };
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('home');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const circularMenuItems = [
    { id: 1, label: 'ENGAGE', color: '#22c55e', icon: '👥' },
    { id: 2, label: 'FOOD', color: '#eab308', icon: '🍽️' },
    { id: 3, label: 'TRADE', color: '#f97316', icon: '📊' },
    { id: 4, label: 'LEARN', color: '#3b82f6', icon: '📚' },
    { id: 5, label: 'PROFIT', color: '#a855f7', icon: '💰' },
    { id: 6, label: 'TECH', color: '#ec4899', icon: '💻' },
  ];

  const [selectedShort, setSelectedShort] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);

  // Fetch popular courses from the server
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/public/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };

    fetchCourses();
  }, []);

  // Helper function for next video functionality
  const playNextVideo = (currentVideoId: number) => {
    const currentIndex = videos.findIndex(v => v.id === currentVideoId);
    const nextIndex = (currentIndex + 1) % videos.length; // Loop back to first video if at end
    const nextVideo = videos[nextIndex];
    if (nextVideo) {
      setSelectedShort(nextVideo);
    }
  };

  // Video player state management
  const VideoPlayer = ({ video }: { video: Video }) => {
    const [playerState, setPlayerState] = useState('paused');
    const playerRef = useRef<any>(null);
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
            onReady: (event: any) => {
              setPlayerState('playing');
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
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

  const processedVideos = getProcessedVideos();
  const videos: Video[] = Array.isArray(processedVideos) ? processedVideos.filter((v): v is Video => v !== null) : [];

  const openShort = (video: Video) => {
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

  // Fetch topics from database
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/public/topics');
        if (response.ok) {
          const data = await response.json();
          setTopics(data.topics);
        }
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Generate colors for topics
  const getTopicColor = (index: number) => {
    const colors = ['bg-green-100', 'bg-amber-100', 'bg-red-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100'];
    return colors[index % colors.length];
  };

  // Generate icons for topics
  const getTopicIcon = (index: number) => {
    const icons = ['🌾', '🌱', '🐛', '💧', '🚜', '📊'];
    return icons[index % icons.length];
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
          {/* WhatsApp Icon - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block relative group">
            <a 
              href="https://wa.me/?text=I%20want%20to%20learn%20more%20about%20farming%20on%20AgriSkills"
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
              Learn on WhatsApp
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-b-4 border-b-gray-900 border-r-4 border-r-transparent"></div>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/login')}
            className="text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg font-bold tracking-wider whitespace-nowrap hover:text-yellow-200 transition-colors cursor-pointer"
          >
            LOGIN/ SIGN UP
          </button>
        
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
          <div className="flex justify-between items-center mt-3 mb-4 md:mb-5 lg:mb-6 xl:mb-8">
            <h2 className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold">Videos</h2>
            {/* <button className="text-green-600 text-xs md:text-sm lg:text-base xl:text-lg font-medium hover:text-green-700 transition-colors">View More</button> */}
          </div>

          {/* Horizontal scroll for all screen sizes */}
          <div className="flex overflow-x-auto gap-3 sm:gap-4 lg:gap-6 px-1 pb-2 scrollbar-hide snap-x snap-mandatory">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-36 sm:w-48 md:w-52 lg:w-56 xl:w-60 h-52 sm:h-64 md:h-68 lg:h-72 snap-start"
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
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                    {video.title}
                  </h3>
                  <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-1">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium">{video.instructor.charAt(0)}</span>
                    </div>
                    <span className="truncate">{video.instructor}</span>
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm leading-tight">
                    <span>{video.views} views</span> · <span>{video.timeAgo}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Learn on WhatsApp Button - Mobile Only */}
          <div className="mt-8 mb-4 sm:hidden">
            <a 
              href="https://wa.me/?text=I%20want%20to%20learn%20more%20about%20farming%20on%20AgriSkills"
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4 hover:bg-green-100 transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <div className="flex items-center">
                <div className="bg-green-500 rounded-full p-2 mr-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium text-base">Learn on WhatsApp</span>
              </div>
              <div className="bg-white rounded-full p-1.5 shadow-sm">
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </div>
            </a>
          </div>
          
          {/* See By Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">See By</h3>
            
            {/* Topics Grid */}
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
              {topicsLoading ? (
                <div className="flex items-center justify-center w-full py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                </div>
              ) : topics.length === 0 ? (
                <div className="flex items-center justify-center w-full py-8 text-gray-500">
                  <p>No topics available yet</p>
                </div>
              ) : (
                topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="bg-white rounded-xl overflow-hidden min-w-[140px] cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push('/login')}
                  >
                    {/* Topic Thumbnail */}
                    {topic.thumbnail ? (
                      <div className="relative h-24 w-full">
                        <Image
                          src={topic.thumbnail}
                          alt={topic.title}
                          layout="fill"
                          objectFit="cover"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`${getTopicColor(index)} h-24 w-full flex items-center justify-center`}>
                        <div className="text-3xl">{getTopicIcon(index)}</div>
                      </div>
                    )}
                    {/* Topic Title */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-700 text-center">{topic.title}</h4>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Search Section */}
          <div className="mt-8">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search Topic"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-500"
                />
                {/* Settings/Filter Icon */}
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Random Topics or Search Results */}
            <div className="mt-6">
              {searchQuery ? (
                // Show search results in card format with images and details
                topics
                  .filter(topic => 
                    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .length > 0 ? (
                  <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {topics
                        .filter(topic => 
                          topic.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((topic, index) => (
                          <div
                            key={topic.id}
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push('/login')}
                          >
                            {/* Topic Image */}
                            <div className="relative h-24 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                              <div className="text-white text-2xl">{getTopicIcon(index)}</div>
                              {/* Topic ID Badge */}
                              <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                                EH{(parseInt(topic.id) * 100 + 445).toString().padStart(4, '0')}
                              </div>
                              {/* Status Badge */}
                              {index % 3 === 0 && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  NEW
                                </div>
                              )}
                              {index % 3 === 1 && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  BEST
                                </div>
                              )}
                            </div>
                            
                            {/* Topic Content */}
                            <div className="p-3">
                              <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{topic.title}</h4>
                              <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                                {topic.description || `Learn essential skills and techniques in ${topic.title.toLowerCase()} with expert guidance and practical applications.`}
                              </p>
                              
                              {/* Subtopic Info */}
                              <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center">
                                    <BookOpen className="w-2 h-2 text-orange-600" />
                                  </div>
                                  <span>{topic._count?.subtopics || 0} Subtopics</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Play className="w-2 h-2 text-blue-600" />
                                  </div>
                                  <span>{topic.subtopics?.reduce((total, subtopic) => total + (subtopic._count?.courses || 0), 0) || 0} Courses</span>
                                </div>
                              </div>
                              
                              {/* View More Button */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/topic/${topic.id}`);
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-4 rounded-lg transition-colors"
                              >
                                View More
                              </button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  // Show "No results" message when search yields no results
                  <div className="flex items-center justify-center w-full py-8 text-gray-500">
                    <p>No topics found matching "{searchQuery}"</p>
                  </div>
                )
              ) : (
                // Show 6 random topics in card format when no search query
                topics.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {topics
                      .sort(() => Math.random() - 0.5) // Shuffle the array
                      .slice(0, 6) // Take first 6 items
                      .map((topic, index) => (
                        <div
                          key={topic.id}
                          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push('/login')}
                        >
                          {/* Topic Image */}
                          {topic.thumbnail ? (
                            <div className="relative h-24 w-full">
                              <Image
                                src={topic.thumbnail}
                                alt={topic.title}
                                layout="fill"
                                objectFit="cover"
                                className="object-cover"
                              />
                              {/* Topic ID Badge */}
                              <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                                EH{(parseInt(topic.id) * 100 + 445).toString().padStart(4, '0')}
                              </div>
                              {/* Status Badge */}
                              {index % 3 === 0 && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  NEW
                                </div>
                              )}
                              {index % 3 === 1 && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  BEST
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative h-24 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                              <div className="text-white text-2xl">{getTopicIcon(index)}</div>
                              {/* Topic ID Badge */}
                              <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                                EH{(parseInt(topic.id) * 100 + 445).toString().padStart(4, '0')}
                              </div>
                              {/* Status Badge */}
                              {index % 3 === 0 && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  NEW
                                </div>
                              )}
                              {index % 3 === 1 && (
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  BEST
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Topic Content */}
                          <div className="p-3">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{topic.title}</h4>
                            <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                              {topic.description || `Learn essential skills and techniques in ${topic.title.toLowerCase()} with expert guidance and practical applications.`}
                            </p>
                            
                            {/* Subtopic Info */}
                            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center">
                                  <BookOpen className="w-2 h-2 text-orange-600" />
                                </div>
                                <span>{topic._count?.subtopics || 0} Subtopics</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Play className="w-2 h-2 text-blue-600" />
                                </div>
                                <span>{topic.subtopics?.reduce((total, subtopic) => total + (subtopic._count?.courses || 0), 0) || 0} Courses</span>
                              </div>
                            </div>
                            
                            {/* View More Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/topic/${topic.id}`);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              View More
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : null
              )}
            </div>
          </div>
          
          {/* Popular Courses Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">Popular Courses</h3>
              <button 
                onClick={() => router.push('/login')}
                className="text-green-600 text-sm md:text-base font-medium hover:text-green-700 transition-colors"
              >
                View All
              </button>
            </div>
            
            {/* Courses Horizontal Scroll */}
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x snap-mandatory">
              {/* Display message if no courses are available */}
              {courses.length === 0 ? (
                <div className="flex items-center justify-center w-full py-8 text-gray-500">
                  <p>No courses available</p>
                </div>
              ) : (
                courses.map((course) => (
                  <motion.div
                    key={course.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-72 xl:w-80 snap-start"
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/login')}
                  >
                    {/* Course Content */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base mb-2 line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                        {course.title}
                      </h4>
                      <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                      {/* Learn More Button */}
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium py-2.5 px-4 rounded-lg transition-colors group-hover:bg-green-700">
                        Learn More
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
          </div>
          
          {/* Success Stories Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">Success Stories</h3>
              <button 
                onClick={() => router.push('/login')}
                className="text-green-600 text-sm md:text-base font-medium hover:text-green-700 transition-colors"
              >
                View All
              </button>
            </div>
            
            {/* Success Stories Horizontal Scroll */}
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x snap-mandatory">
              {[
                {
                  id: 1,
                  title: "Rekha trained 12 women in tailoring",
                  description: "Rekha started a small training center in her village after completing our tailoring course.",
                  emoji: "✂️",
                  category: "Tailoring",
                  impact: "12 women trained"
                },
                {
                  id: 2,
                  title: "Raju started organic farming in his village",
                  description: "After learning organic farming techniques, Raju converted his 5-acre farm to profitable organic cultivation.",
                  emoji: "🌱",
                  category: "Organic Farming",
                  impact: "5-acre farm converted"
                },
                {
                  id: 3,
                  title: "Meera's dairy business flourishes",
                  description: "Meera expanded her dairy from 2 cows to 15 cows, increasing her monthly income by 400%.",
                  emoji: "🥛",
                  category: "Dairy Farming",
                  impact: "400% income increase"
                },
                {
                  id: 4,
                  title: "Suresh's poultry farm success",
                  description: "Starting with 50 chickens, Suresh now manages 1000+ birds and supplies to local markets.",
                  emoji: "🐔",
                  category: "Poultry Farming",
                  impact: "1000+ birds managed"
                },
                {
                  id: 5,
                  title: "Priya's vegetable garden transformation",
                  description: "Priya transformed her backyard into a profitable vegetable garden earning ₹8000 monthly.",
                  emoji: "🥬",
                  category: "Kitchen Gardening",
                  impact: "₹8000 monthly income"
                },
                {
                  id: 6,
                  title: "Ramesh's bee-keeping venture",
                  description: "Ramesh started with 5 hives and now harvests 200kg of honey annually.",
                  emoji: "🐝",
                  category: "Bee Keeping",
                  impact: "200kg honey annually"
                },
                {
                  id: 7,
                  title: "Sunita's mushroom cultivation",
                  description: "Sunita's mushroom farm produces 50kg daily, supplying to restaurants and hotels.",
                  emoji: "🍄",
                  category: "Mushroom Farming",
                  impact: "50kg daily production"
                },
                {
                  id: 8,
                  title: "Vikram's fish farming success",
                  description: "Vikram converted his 2-acre pond into a thriving fish farm with multiple species.",
                  emoji: "🐟",
                  category: "Fish Farming",
                  impact: "2-acre fish farm"
                },
                {
                  id: 9,
                  title: "Kavita's spice processing unit",
                  description: "Kavita processes and packages spices, supplying to 20+ retail stores in her district.",
                  emoji: "🌶️",
                  category: "Food Processing",
                  impact: "20+ stores supplied"
                },
                {
                  id: 10,
                  title: "Ankit's hydroponic farming",
                  description: "Ankit's soilless farming setup produces fresh vegetables year-round in controlled environment.",
                  emoji: "💧",
                  category: "Hydroponic Farming",
                  impact: "Year-round production"
                }
              ].map((story, index) => (
                <motion.div
                  key={story.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-72 xl:w-80 snap-start"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/login')}
                >
                  <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-5xl">
                    <span>{story.emoji}</span>
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1 rounded-full font-semibold">
                      {story.category}
                    </div>
                    
                    {/* Impact Badge */}
                    <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {story.impact}
                    </div>
                  </div>
                  
                  {/* Story Content */}
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {story.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {story.description}
                    </p>
                    
                    {/* Read More Button */}
                    <button className="text-green-600 text-sm font-semibold hover:text-green-700 transition-colors flex items-center gap-1">
                      <span>Read Full Story</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Certificates Section */}
          <div className="mt-3">
            {/* Single Certificate Image */}
            <div className="flex justify-center">
              <Image 
                src="/images/certificate.png"
                alt="Certificate"
                width={400}
                height={300}
                className="rounded-lg shadow-lg opacity-90 w-full max-w-md lg:max-w-none lg:w-3/5"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="lg:hidden bg-gray-50 border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] flex-shrink-0">
        <div className="flex justify-around items-center py-2">
          {/* Home Button */}
          <button
            onClick={() => setActiveNav('home')}
            className={`flex flex-col items-center px-4 py-2 transition-colors ${activeNav === 'home' ? 'text-yellow-600' : 'text-gray-500'}`}
          >
            <Home className="w-6 h-6" strokeWidth={activeNav === 'home' ? 2.5 : 2} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          
          {/* Speak Button - Center with green circle */}
          <button
            onClick={() => setActiveNav('speak')}
            className="relative flex flex-col items-center -mt-7"
          >
            <div className="bg-green-600 rounded-full p-4 shadow-lg border-4 border-white">
              <Mic className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs mt-1 font-medium text-green-600">Speak</span>
          </button>
          
          {/* Learn Button */}
          <button
            onClick={() => setActiveNav('learn')}
            className={`flex flex-col items-center px-4 py-2 transition-colors ${activeNav === 'learn' ? 'text-gray-700' : 'text-gray-500'}`}
          >
            <div className="relative">
              <BookOpen className="w-6 h-6" strokeWidth={activeNav === 'learn' ? 2.5 : 2} />
              <div className="absolute -top-1 -right-1 w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-gray-600 border-r-[6px] border-r-transparent"></div>
            </div>
            <span className="text-xs mt-1 font-medium">Learn</span>
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

              {/* Next Video Button - Positioned on the right side */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  playNextVideo(selectedShort.id);
                }}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/60 active:bg-black/80 text-white rounded-full p-3 transition-all duration-200 transform active:scale-95 hover:bg-black/70"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  zIndex: 20
                }}
                title="Next Video"
              >
                <ArrowRight className="w-6 h-6 pointer-events-none" />
              </button>

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
