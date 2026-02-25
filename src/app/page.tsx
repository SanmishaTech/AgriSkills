'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, Search, BookOpen, Play, Globe, Menu, Smile, ArrowRight, ArrowLeft, X, Heart, MessageCircle, Share, MoreVertical, Pause, RotateCcw, Mic, Headphones, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { LanguageIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import FullScreenDemoPlayer from '@/components/FullScreenDemoPlayer';
import HomeNavbar from '@/components/HomeNavbar';
// Topic accent gradients — cycling palette
const TOPIC_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-sky-600',
];
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

interface SuccessStory {
  id: number;
  title: string;
  description: string;
  emoji: string;
  category: string;
  impact: string;
  fullStory: string;
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
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedShort, setSelectedShort] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Read ?q= search param from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, []);
  // Demo player state
  const [showDemoPlayer, setShowDemoPlayer] = useState(false);
  const [demoUrls, setDemoUrls] = useState<string[]>([]);
  const [demoTitles, setDemoTitles] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSuccessStory, setSelectedSuccessStory] = useState<SuccessStory | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const seeByScrollRef = useRef<HTMLDivElement>(null);
  const videosScrollRef = useRef<HTMLDivElement>(null);
  const [activeVideoDot, setActiveVideoDot] = useState(0);
  // Active topic tab — null means "All"
  const [activeTopicTab, setActiveTopicTab] = useState<string | null>(null);

  // Search Results & Filter state
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showPrepCoursesOnly, setShowPrepCoursesOnly] = useState(false);
  const [showHandsOn, setShowHandsOn] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>('relevant');

  // Certificate Preview State
  const [randomCourseName, setRandomCourseName] = useState('Sustainable Farming Complete Course');
  const [randomCertId, setRandomCertId] = useState('');
  const [randomDate, setRandomDate] = useState('');

  useEffect(() => {
    // Generate static random values once mounted to avoid hydration differences
    setRandomCertId(`CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setRandomDate(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    // Pick a random topic name once topics are loaded
    if (topics.length > 0) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      setRandomCourseName(topic.title);
    }
  }, [topics]);

  // State for YouTube shorts
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  // Fetch YouTube shorts from the database
  useEffect(() => {
    const fetchYouTubeShorts = async () => {
      try {
        const response = await fetch('/api/public/youtube-shorts?limit=15');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.shorts)) {
            setVideos(data.shorts);
          } else {
            console.warn('Invalid YouTube shorts data format:', data);
            setVideos([]);
          }
        } else {
          console.error('Failed to fetch YouTube shorts:', response.status);
          setVideos([]);
        }
      } catch (error) {
        console.error('Error fetching YouTube shorts:', error);
        setVideos([]);
      } finally {
        setVideosLoading(false);
      }
    };

    fetchYouTubeShorts();
  }, []);

  // --- Framer Motion Carousel State ---
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current) {
        setCarouselWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };
    updateWidth();
    // Use a small delay on load in case images load
    setTimeout(updateWidth, 500);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [videos]);

  useMotionValueEvent(x, "change", (latestX) => {
    if (carouselWidth > 0) {
      const progress = Math.abs(latestX) / carouselWidth;
      const dotIndex = Math.max(0, Math.min(2, Math.round(progress * 2)));
      if (activeVideoDot !== dotIndex) {
        setActiveVideoDot(dotIndex);
      }
    }
  });

  const smoothScrollTo = (top: number) => {
    if (typeof window === 'undefined') return;
    const scroller = (document.scrollingElement || document.documentElement) as HTMLElement;
    const start = scroller.scrollTop || 0;
    const change = top - start;
    const duration = 520;
    const startTime = performance.now();
    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);
      scroller.scrollTop = start + change * eased;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const scrollVideos = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      // Find the first video card to calculate the exact width of "2 boxes"
      const firstCard = carouselRef.current.querySelector('.group');
      // Adding 16px to account for the gap-4 between cards
      const cardPlusGap = firstCard ? firstCard.clientWidth + 16 : carouselRef.current.offsetWidth / 1.5;
      const scrollAmount = cardPlusGap * 2;

      let newX = direction === 'left' ? x.get() + scrollAmount : x.get() - scrollAmount;
      // Clamp bounds
      newX = Math.max(-carouselWidth, Math.min(0, newX));

      animate(x, newX, {
        type: "spring",
        bounce: 0,
        duration: 0.8
      });
    }
  };

  const scrollToVideoDot = (dotIndex: number) => {
    if (carouselRef.current) {
      const targetScroll = -(carouselWidth / 2) * dotIndex;
      animate(x, targetScroll, {
        type: "spring",
        bounce: 0,
        duration: 0.8
      });
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    // The x motion value is automatically updated by drag.
    // The useMotionValueEvent hook updates the active dot.
    // No manual state update needed here for x or activeVideoDot.
  };

  const circularMenuItems = [
    { id: 1, label: 'ENGAGE', color: '#22c55e', icon: '👥' },
    { id: 2, label: 'FOOD', color: '#eab308', icon: '🍽️' },
    { id: 3, label: 'TRADE', color: '#f97316', icon: '📊' },
    { id: 4, label: 'LEARN', color: '#3b82f6', icon: '📚' },
    { id: 5, label: 'PROFIT', color: '#a855f7', icon: '💰' },
    { id: 6, label: 'TECH', color: '#ec4899', icon: '💻' },
  ];

  // Helper function for next video functionality
  const playNextVideo = (currentVideoId: number) => {
    if (!Array.isArray(videos) || videos.length === 0) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideoId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % videos.length : 0; // Loop or start from first
    const nextVideo = videos[nextIndex];
    if (nextVideo) {
      setSelectedShort(nextVideo);
    }
  };

  // Open topic demo player by fetching demo videos for the topic
  const openTopicDemo = async (topicId: string) => {
    try {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) {
        router.push(`/topic/${topicId}`);
        return;
      }
      const data = await res.json();
      const demoPairs = Array.isArray(data?.demoVideos)
        ? data.demoVideos
          .map((v: any) => ({
            youtubeId: v?.youtubeId,
            title: typeof v?.title === 'string' ? v.title : ''
          }))
          .filter((p: any) => typeof p.youtubeId === 'string' && p.youtubeId.length === 11)
        : [];
      const urls: string[] = demoPairs.map((p: any) => `https://www.youtube.com/watch?v=${p.youtubeId}`);
      const titles: string[] = demoPairs.map((p: any) => p.title);

      if (urls.length > 0) {
        setSelectedTopicId(topicId);
        setDemoUrls(urls);
        setDemoTitles(titles);
        setShowDemoPlayer(true);
      } else {
        router.push(`/topic/${topicId}`);
      }
    } catch (e) {
      router.push(`/topic/${topicId}`);
    }
  };

  const closeDemo = () => {
    setShowDemoPlayer(false);
    setDemoUrls([]);
    setDemoTitles([]);
    setSelectedTopicId(null);
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



  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch topics from database
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/public/topics');
        if (response.ok) {
          const data = await response.json();
          setTopics(Array.isArray(data?.topics) ? data.topics : []);
        }
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let shouldScroll = false;

    try {
      shouldScroll = sessionStorage.getItem('scrollToSearch') === '1';
      if (shouldScroll) sessionStorage.removeItem('scrollToSearch');
    } catch {
      shouldScroll = false;
    }

    if (!shouldScroll) return;

    let cancelled = false;
    const t = window.setTimeout(() => {
      const run = () => {
        if (cancelled) return;
        const el = document.getElementById('search');
        if (!el) return;
        const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 96);
        smoothScrollTo(top);
      };

      requestAnimationFrame(() => requestAnimationFrame(run));
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
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

  // Smoothly scroll the "See By" horizontal list
  const scrollSeeBy = (direction: 'left' | 'right') => {
    const el = seeByScrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  // Filtered topics based on search + active tab + sortOrder
  const filteredTopics = topics.filter(t => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = !activeTopicTab || t.id === activeTopicTab;
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    if (sortOrder === 'asc') return a.title.localeCompare(b.title);
    if (sortOrder === 'desc') return b.title.localeCompare(a.title);
    return 0; // 'relevant' defaults to no change
  });

  const renderTopicsGrid = () => {
    return topicsLoading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    ) : filteredTopics.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <BookOpen className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium text-gray-500">No topics found</p>
        <p className="text-sm mt-1 text-gray-400">Try adjusting your filters or search term</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTopics.map((topic, index) => {
          const gradientClass = TOPIC_COLORS[index % TOPIC_COLORS.length];
          const totalCourses = topic.subtopics?.reduce((sum, st) => sum + (st._count?.courses || 0), 0) || 0;
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              onClick={() => openTopicDemo(topic.id)}
              className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative h-40 overflow-hidden">
                {topic.thumbnail ? (
                  <img
                    src={topic.thumbnail}
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                    <BookOpen className="w-10 h-10 text-white/80" />
                  </div>
                )}
                {/* Popular badge on every 3rd item */}
                {index % 3 === 1 && (
                  <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                    Popular
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 leading-snug mb-2 group-hover:text-green-600 transition-colors">
                  {topic.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {topic._count?.subtopics || 0} subtopics
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" />
                    {totalCourses} courses
                  </span>
                </div>
                <button className="mt-3 w-full text-xs font-semibold text-green-600 border border-green-600 rounded-lg py-1.5 hover:bg-green-600 hover:text-white transition-colors">
                  Explore →
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full relative">

      {/* ── Udemy-style sticky white navbar ── */}
      <HomeNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileSearchActive={isMobileSearchActive}
        setIsMobileSearchActive={setIsMobileSearchActive}
        onExploreClick={() => {
          document.getElementById('topics-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main className="flex-1">

        {searchQuery.length > 0 ? (
          /* ── Search Results UI ── */
          <section className="bg-white min-h-[50vh]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">
                {filteredTopics.length} results for &quot;{searchQuery}&quot;
              </h1>



              <div className="mt-8">
                {renderTopicsGrid()}
              </div>
            </div>
          </section>
        ) : (
          /* ── Default Hero & Exploring UI ── */
          <>
            {/* ── Udemy Style Hero Banner ── */}
            <section className="relative w-full bg-white sm:pt-6">
              <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 relative block h-[240px] sm:h-[380px] lg:h-[440px] sm:mb-8 lg:mb-12">
                {/* Image Container */}
                <div className="relative w-full h-full sm:mx-0">
                  {/* Desktop Banner Image */}
                  <Image
                    src="/images/desktopview.jpg"
                    alt="Farming Desktop"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1280px"
                    className="hidden sm:block object-top object-cover sm:rounded-lg lg:rounded-xl shadow-md"
                    priority
                  />
                  {/* Mobile Banner Image */}
                  <Image
                    src="/images/Banner.jpeg"
                    alt="Farming Mobile"
                    fill
                    sizes="100vw"
                    className="block sm:hidden object-top object-cover shadow-md"
                    priority
                  />
                </div>
              </div>
            </section>



            {/* ── Skills / Videos Showcase Section ── */}
            <section className="bg-gray-50 py-12 md:py-16 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
                  {/* Left content */}
                  <div className="lg:w-1/3 pt-4 flex flex-col justify-center font-serif">
                    <h2 className="text-[32px] sm:text-4xl lg:text-[40px] font-bold text-[#2d2f31] leading-tight mb-4 tracking-tight">
                      Learn Farming<br />Skills That<br />Change Lives
                    </h2>
                    <p className="text-base md:text-[17px] text-[#2d2f31] font-sans mb-6 leading-relaxed">
                      Join thousands of farmers mastering modern techniques — from organic cultivation to dairy, poultry, and agri-tech.
                    </p>
                    <div>
                      <button
                        onClick={() => isAuthenticated ? router.push('/dashboard/user') : router.push('/learn')}
                        className="flex justify-center flex-shrink-0 items-center bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-6 h-12 text-[16px] transition-colors rounded-none w-full sm:w-max border border-transparent font-sans shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>

                  {/* Right content - Scrollable Videos */}
                  <div className="lg:w-2/3 w-full overflow-hidden">
                    <div className="relative">
                      <div ref={carouselRef} className="overflow-hidden">
                        <motion.div
                          className="flex gap-4 pb-6"
                          drag="x"
                          dragConstraints={{ right: 0, left: -carouselWidth }}
                          dragElastic={0.15}
                          onDragEnd={handleDragEnd}
                          style={{ x }}
                        >
                          {videosLoading ? (
                            <div className="flex gap-4 w-full pb-6">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className="bg-gray-200 rounded-lg sm:rounded-xl flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 xl:w-48 relative border border-gray-300 overflow-hidden"
                                  style={{ aspectRatio: '9/16', height: 'auto' }}
                                >
                                  <div className="w-full h-full animate-pulse bg-gray-300/50"></div>
                                  <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 pointer-events-none">
                                    <div className="h-3 bg-gray-400/50 w-3/4 rounded animate-pulse"></div>
                                    <div className="h-3 bg-gray-400/50 w-1/2 rounded animate-pulse"></div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-5 h-5 bg-gray-400/50 rounded-full animate-pulse flex-shrink-0"></div>
                                      <div className="h-2 bg-gray-400/50 w-1/3 rounded animate-pulse"></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : videos.length === 0 ? (
                            <div className="flex items-center justify-center w-full py-12 text-gray-500">
                              <p>No videos available yet</p>
                            </div>
                          ) : (
                            videos.map((video) => (
                              <motion.div
                                key={video.id}
                                className="bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing group flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 xl:w-48 relative"
                                style={{ aspectRatio: '9/16', height: 'auto' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => openShort(video)}
                              >
                                {/* YouTube Short Thumbnail - Vertical */}
                                <div className="relative w-full h-full bg-black overflow-hidden pointer-events-none">
                                  {/* Thumbnail Image */}
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                                    }}
                                  />

                                  {/* Play button overlay */}
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="bg-white/90 rounded-full p-3 shadow-lg">
                                      <Play className="w-6 h-6 text-black fill-black ml-1" />
                                    </div>
                                  </div>

                                  {/* Duration badge - YouTube Shorts style */}
                                  <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                                    {video.duration}
                                  </div>

                                  {/* Shorts badge */}
                                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                                    SHORTS
                                  </div>

                                  {/* Views count overlay */}
                                  <div className="absolute bottom-3 left-3 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                    {video.views}
                                  </div>
                                </div>

                                {/* Video info overlay - positioned at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 text-white pointer-events-none">
                                  <h3 className="font-semibold text-white mb-1 text-sm line-clamp-2 leading-tight">
                                    {video.title}
                                  </h3>
                                  <div className="flex items-center text-gray-200 text-xs mb-1">
                                    <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                      <span className="text-xs font-medium">{video.instructor.charAt(0)}</span>
                                    </div>
                                    <span className="truncate text-xs">{video.instructor}</span>
                                  </div>
                                  <div className="text-gray-300 text-xs">
                                    <span>{video.timeAgo}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </motion.div>
                      </div>
                      {/* Carousel Navigation (Udemy Style) */}
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <button
                          onClick={() => scrollVideos('left')}
                          className="w-8 h-8 rounded-full border border-[#2d2f31] flex items-center justify-center text-[#2d2f31] hover:bg-gray-100 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map((dot) => (
                            <button
                              key={dot}
                              onClick={() => scrollToVideoDot(dot)}
                              className={`rounded-full transition-all duration-300 ${activeVideoDot === dot
                                ? "w-4 h-1.5 bg-[#a435f0]"
                                : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400"
                                }`}
                              aria-label={`Go to slide ${dot + 1}`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => scrollVideos('right')}
                          className="w-8 h-8 rounded-full border border-[#2d2f31] flex items-center justify-center text-[#2d2f31] hover:bg-gray-100 transition-colors"
                        >
                          <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 4-column topic card grid ── */}
            <section id="topics-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#2d2f31]">
                    {activeTopicTab
                      ? topics.find(t => t.id === activeTopicTab)?.title || 'Topics'
                      : searchQuery ? `Results for "${searchQuery}"` : 'What would you like to learn?'}
                  </h2>
                  <p className="text-base text-[#6a6f73] mt-2">
                    {filteredTopics.length} {filteredTopics.length === 1 ? 'topic' : 'topics'} available
                  </p>
                </div>
              </div>

              {renderTopicsGrid()}
            </section>
          </>
        )}

        {/* ── About Us and Certificates ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* About Us */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 flex-1">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 mb-4">About Us</h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Shop for Change Fair Trade exists to build a future where rural and tribal communities shape India&apos;s economy through ownership, innovation, and cultural pride. We help farmers and producers move from the margins to the marketplace by strengthening direct market linkages, promoting agroforestry, delivering training in natural/regenerative farming and business skills, and enabling digital inclusion—including support to use mobile tools, e-commerce, and AI for better decisions. Women&apos;s empowerment is central to our approach because women&apos;s leadership uplifts entire families and communities.
              </p>
            </div>

            {/* Certificates Section */}
            <div className="lg:w-[450px] shrink-0 flex items-center justify-center overflow-hidden">
              <div
                className="relative w-full aspect-[297/210] shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden bg-white border border-gray-200"
                style={{ containerType: 'inline-size' }}
              >
                <Image
                  src="/images/preview-certificate.jpeg"
                  alt="Get Certified"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="w-full h-full"
                  unoptimized
                />

                {/* Dynamically overlaid text to simulate PDF */}
                <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ color: '#1F2937' }}>
                  {/* Name */}
                  <div className="absolute font-bold tracking-wide" style={{ left: '8.0%', top: '29.3%', fontSize: '2cqw', color: '#1a365d', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    Pinak Pawar
                  </div>
                  {/* Course Name */}
                  <div className="absolute" style={{ left: '8.0%', top: '40%', fontSize: '2cqw', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {randomCourseName}
                  </div>
                  {/* Certificate ID */}
                  <div className="absolute font-medium" style={{ left: '77.5%', top: '71.5%', fontSize: '1.6cqw', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {randomCertId}
                  </div>
                  {/* Date */}
                  <div className="absolute font-medium" style={{ left: '77.5%', top: '74.5%', fontSize: '1.6cqw', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    {randomDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pb-24">
          {/* Success Stories Section */}
          <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">Success Stories</h3>
              <button
                onClick={() => router.push('/success-stories')}
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
                  title: "Transforming Smallholder Farming with Sustainable Farming",
                  description: "Narayan Bhau Bhoye from Gorthan Village, Palghar District implemented the No-Till/Regenerative Technique (SRT) to transform his smallholder farm.",
                  image: "/images/successstories/successstories-1.jpg",
                  category: "Sustainable Farming",
                  impact: "₹7,850 Net Gain",
                  emoji: "🌱",
                  fullStory: "Practices Farmer Mr. Narayan Bhau Bhoye, Gorthan Village, Palghar District\nA Real Life Case Study by Shop For Change Fair Trade NGO\n\n**Background:**\nShop for Change Fair Trade, with funding support from GeBBS Healthcare, launched a capacity-building project to promote sustainable agricultural practices among tribal farmers in Jawhar. A two-day focused training session was conducted for over 70 tribal farmers, ensuring equal participation from men and women. The training for male farmers was held in January 2025, following which one of the farmers immediately adopted the No-Till/Regenerative Technique (SRT) on his farm.\n\nNarayan Bhau Bhoye, a smallholder farmer from Gorthan village in Palghar district, is a notable example of success from this intervention. Known for his experimental nature, Narayan decided to initially apply SRT on a small portion of his land—2.5 gunthas—to assess the results before scaling up. Based on the outcomes from this trial, he plans to implement SRT across a larger area during the upcoming monsoon season.\n\n**SRT Application Details:**\n• Crop Selection: 1 Guntha Groundnut, 1 Guntha Wal (Indian Bean), 0.5 Guntha Chickpea\n• Date of Sowing: January 23, 2025\n• Expected Harvest Date: May 10, 2025\n\n**Benefits Experienced:**\n• Reduced Labor Requirement: Decreased from 10-15 workers (traditional farming) to 4-5 workers under SRT.\n• Cost Savings: Labor savings amounted to approximately ₹3,200.\n• Enhanced Crop Growth: Crop height increased from 2-3 feet (traditional) to over 3 feet with SRT.\n\n**Projected Economic Impact Summary:**\n• Income with Traditional Methods: ₹6,875\n• Projected Income with SRT: ₹11,525\n• Net Increase in Income: ₹4,650\n• Total Net Gain (Income Increase + Labor Savings): ₹7,850"
                },
                {
                  id: 2,
                  title: "Ecovibe Krushi Producer Company – A Women-Led Model of Rural Enterprise",
                  description: "In the tribal belt of Palghar, Maharashtra, women farmers have long faced systemic barriers to income security and market access.",
                  image: "/images/successstories/successstories-2.jpg",
                  category: "Rural Enterprise",
                  impact: "500+ Farmers Mobilized",
                  emoji: "👩‍🌾",
                  fullStory: "**Background**\nIn the tribal belt of Palghar, Maharashtra, women farmers have long faced systemic barriers to income security, access to markets, and leadership opportunities. Recognizing the need for structural change, Shop for Change Fair Trade initiated the formation of a women-centric Farmer Producer Organization (FPO) to create long-term, market-driven empowerment.\n\n**The Intervention**\nIn February 2025, Ecovibe Krushi Producer Company Ltd. was officially registered. Designed to be a community-owned and women-led FPO, it focuses on building collective bargaining power, strengthening agricultural value chains, and enabling direct access to markets.\n\n**Projected Key Highlights**\n• 500+ tribal farmers to be mobilized, with majority women shareholders\n• Capacity-building workshops on FPO management, bookkeeping, agri-finance, and government schemes\n• Collective procurement of inputs (seeds, bio-fertilizers, equipment) to reduce costs by 15–20%\n• Development of value-added products such as turmeric powder, millet mixes, and forest produce\n\n**Expected Outcomes**\n• 30–50% increase in net incomes through improved input access and collective marketing\n• Enhanced women's leadership in agri-business and governance structures\n• Strengthened resilience against climate and market shocks through diversified income streams\n• A replicable model for scaling women-led FPOs in other tribal regions across India\n\n**Why This Matters**\nEcovibe Krushi Producer Company is envisioned as a blueprint for inclusive rural development, where tribal women shift from the margins to the mainstream of agricultural enterprise. Through market linkage, skill-building, and collective ownership, Ecovibe aims to redefine what rural self-reliance looks like."
                },
                {
                  id: 3,
                  title: "Babu Waghera – From Marginal Farmer to Export-Grade Chilli Producer",
                  description: "Babu Waghera, a tribal farmer from Jawhar Taluka in Maharashtra, once relied on irregular daily wage work and low-yield farming for survival.",
                  image: "/images/successstories/successstories-3.jpg",
                  category: "Export Farming",
                  impact: "₹1.5 lakh+ Earned",
                  emoji: "🌶️",
                  fullStory: "**Background**\nBabu Waghera, a tribal farmer from Jawhar Taluka in Maharashtra, once relied on irregular daily wage work and low-yield farming for survival. With minimal access to knowledge or infrastructure, his annual income was limited to around ₹20,000–₹25,000—barely enough to support his family.\n\n**The Turning Point**\nIn 2019, Babu joined a Shop for Change Fair Trade initiative aimed at linking tribal chilli farmers to premium global markets. With technical support, quality inputs, and training, he was selected as one of the farmers to cultivate export-grade green chillies.\n\n**Key Milestone**\nIn 2019–20, Babu's chillies were part of the first-ever tribal farmer export batch to London, supported by JSW Foundation and facilitated by Del Monte as the export partner. This marked a breakthrough in tribal farmer market access and profitability.\n\n**Impact and Achievements**\n• Cultivated high-grade green chillies that met export standards\n• Received post-harvest training in sorting, grading, and packaging\n• Earned over ₹1.5 lakh in a single season—a sixfold increase in his typical annual income\n• Emerged as a community role model, encouraging fellow farmers to shift from low-value crops to high-return, market-linked farming\n\n**Why It Matters**\nBabu Waghera's journey—from a struggling daily wage worker to an international exporter—is a powerful example of what is possible when grassroots talent meets global opportunity. His story reflects the core mission of Shop for Change: empowering farmers through dignified trade, not aid."
                }
              ].map((story, index) => (
                <motion.div
                  key={story.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-72 xl:w-80 snap-start"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/success-stories')}
                >
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {/* @ts-ignore */}
                    {story.image ? (
                      /* @ts-ignore */
                      <Image src={story.image} alt={story.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      /* @ts-ignore */
                      <span className="text-5xl relative z-10">{story.emoji}</span>
                    )}

                    {/* Gradient Overlay for better badge visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent z-0 pointer-events-none" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 text-gray-800 text-xs px-3 py-1 rounded-full font-semibold shadow-sm z-10">
                      {story.category}
                    </div>

                    {/* Impact Badge */}
                    <div className="absolute top-3 right-3 bg-green-600/95 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm z-10">
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
                    <button
                      className="text-green-600 text-sm font-semibold hover:text-green-700 transition-colors flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSuccessStory(story);
                      }}
                    >
                      <span>Read Full Story</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedSuccessStory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedSuccessStory(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-48 sm:h-56 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-5xl overflow-hidden">
                  {/* @ts-ignore */}
                  {selectedSuccessStory.image ? (
                    <>
                      {/* @ts-ignore */}
                      <Image src={selectedSuccessStory.image} alt={selectedSuccessStory.title} layout="fill" objectFit="cover" />
                      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />
                    </>
                  ) : (
                    <span className="relative z-10">{selectedSuccessStory.emoji}</span>
                  )}

                  <button
                    onClick={() => setSelectedSuccessStory(null)}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-128px)]">
                  <div className="flex items-center gap-2 text-sm text-green-600 font-semibold mb-2">
                    <span>{selectedSuccessStory.category}</span>
                    <span>•</span>
                    <span>{selectedSuccessStory.impact}</span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedSuccessStory.title}
                  </h2>

                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedSuccessStory.fullStory.split(/(\*\*.*?\*\*)/).map((part, i) =>
                        part.startsWith('**') && part.endsWith('**') ?
                          <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong> :
                          part
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

        </div>
      </main>



      {/* Fullscreen Demo Player */}
      {
        showDemoPlayer && selectedTopicId && (
          <FullScreenDemoPlayer
            demoUrls={demoUrls}
            demoTitles={demoTitles}
            onClose={closeDemo}
            topicId={selectedTopicId}
          />
        )
      }

      {/* YouTube Shorts Modal */}
      {
        selectedShort && (
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
        )
      }

      {/* Help Dialog */}
      {
        showHelpDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelpDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">About This Page</h2>
                  <button
                    onClick={() => setShowHelpDialog(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">What is this page?</h3>
                    <p className="text-sm leading-relaxed">
                      This is the Gram Kushal homepage - your gateway to agricultural learning. Here you can explore topics, watch educational videos, and discover success stories from farmers who have transformed their lives through our training programs.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">How to use this page</h3>
                    <ul className="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Search Topics:</strong> Use the search bar to find specific agricultural topics you want to learn about.</li>
                      <li><strong>Watch Videos:</strong> Scroll through the Videos section to watch short educational clips.</li>
                      <li><strong>Explore Topics:</strong> Click on any topic card to view subtopics and courses.</li>
                      <li><strong>Learn More:</strong> Click "View More" on any topic to access detailed courses and lessons.</li>
                      <li><strong>Success Stories:</strong> Read inspiring stories of farmers who succeeded with our programs.</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Need more help? Contact our support team or visit your dashboard to start learning.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowHelpDialog(false)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
      }
    </div >
  );
}
