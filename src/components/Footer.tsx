'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home as HomeIcon, BookOpen, Mic, Send } from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePhoto?: string;
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Footer() {
  // Avoid reading localStorage during initial render to keep SSR/CSR identical
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeakOpen, setIsSpeakOpen] = useState(false);
  const [speakDrawerMode, setSpeakDrawerMode] = useState<'half' | 'full'>('half');
  const [speakText, setSpeakText] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speakInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const speakDragControls = useDragControls();
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();

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

  const toggleRecording = () => {
    setSpeechError(null);

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechError('Voice input is not supported in this browser.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      let finalTranscript = '';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const t = res?.[0]?.transcript ?? '';
          if (res.isFinal) finalTranscript += t;
          else interimTranscript += t;
        }

        const combined = (finalTranscript + interimTranscript).trim();
        if (!combined) return;
        setSpeakText((prev) => {
          if (!prev.trim()) return combined;
          return `${prev.replace(/\s+$/g, '')} ${combined}`.trim();
        });
      };

      recognition.onerror = (event: any) => {
        const err = typeof event?.error === 'string' ? event.error : 'unknown';
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setSpeechError('Microphone permission denied.');
        } else if (err === 'no-speech') {
          setSpeechError('No speech detected.');
        } else {
          setSpeechError('Voice input failed.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setSpeechError('Voice input failed to start.');
      setIsRecording(false);
    }
  };

  // Don't show footer on auth pages, topic pages, and learning pages
  const hideOnPages = ['/register', '/login'];
  const shouldHideFooter = hideOnPages.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isTopicRoute = pathname?.startsWith('/topic/');
  const isLearnRoute = pathname?.startsWith('/learn');
  const isQuizRoute = pathname?.includes('/questions');

  useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        if (!token) localStorage.removeItem('user');
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [pathname]);

  // Keep in sync across tabs/windows
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'token' || e.key === 'user') {
        try {
          const token = localStorage.getItem('token');
          const data = localStorage.getItem('user');
          if (token && data) {
            setUser(JSON.parse(data));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!isSpeakOpen) return;

    const t = window.setTimeout(() => {
      speakInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [isSpeakOpen]);

  useEffect(() => {
    if (isSpeakOpen) return;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
  }, [isSpeakOpen]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!isSpeakOpen) return;
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages, isSpeakOpen]);

  const sendSpeakMessage = () => {
    const text = speakText.trim();
    if (!text) return;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setChatMessages((prev) => [...prev, { id, role: 'user', content: text }]);
    setSpeakText('');

    const replyId = `${Date.now()}-${Math.random().toString(16).slice(2)}-a`;
    window.setTimeout(() => {
      setChatMessages((prev) => [...prev, { id: replyId, role: 'assistant', content: 'Thanks! I\'m here to help.' }]);
    }, 250);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Hide footer for: auth pages, dashboard routes, topic pages, learning pages, and quiz pages
  if (shouldHideFooter || isDashboardRoute || isAdminRoute || isTopicRoute || isLearnRoute || isQuizRoute) {
    return null;
  }
  
  // Don't render footer until component is mounted to avoid hydration issues
  if (!mounted) {
    return <div className="h-16" />; // Placeholder to maintain layout
  }

  // Removed login-specific footer; login should not show any footer

  // Render footer for both guests and authenticated users

  // Check if user is admin with explicit validation
  const isUserAdmin = user && user.role && user.role.toLowerCase().trim() === 'admin';
  
  // Learn should always route to the public learn topics page
  const learnHref = '/learn';
  const isLoggedIn = !!user;

  const menuItems = [
    {
      name: 'Home',
      href: '/',
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      name: 'Learn',
      href: learnHref,
      icon: <BookOpen className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Bottom Navigation - Home | Speak | Learn */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/70 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="relative mx-auto max-w-3xl">
          <div className="flex justify-between items-center px-8 py-2">
            {/* Home */}
            <Link
              href={menuItems[0].href}
              className={`flex flex-col items-center text-xs ${pathname === menuItems[0].href ? 'text-amber-600' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              <div className="mb-0.5">{menuItems[0].icon}</div>
              <span>Home</span>
            </Link>

            {/* Spacer for center button */}
            <div className="w-20" />

            {/* Learn */}
            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  router.push('/dashboard/user');
                } else {
                  router.push('/learn');
                }
              }}
              className={`flex flex-col items-center text-xs ${pathname?.startsWith('/learn') ? 'text-amber-600' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              <div className="mb-0.5">{menuItems[1].icon}</div>
              <span>Learn</span>
            </button>
          </div>

          {/* Center Speak Button + Label */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setIsSpeakOpen(true);
                setSpeakDrawerMode('half');
                /* TODO: wire voice action */
              }}
              aria-label="Speak"
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center ring-4 ring-white"
            >
              <Mic className="w-6 h-6" />
            </button>
            <span className="mt-1 text-xs font-medium text-green-700">Speak</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSpeakOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsSpeakOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0, height: speakDrawerMode === 'full' ? '92vh' : '60vh' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 flex flex-col"
              drag="y"
              dragListener={false}
              dragControls={speakDragControls}
              dragSnapToOrigin
              dragConstraints={{ top: -160, bottom: 260 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                const dy = info.offset.y;
                if (dy > 140) {
                  setIsSpeakOpen(false);
                  return;
                }
                if (dy < -120) {
                  setSpeakDrawerMode('full');
                } else {
                  setSpeakDrawerMode('half');
                }
              }}
            >
              <div
                className="px-4 pt-3 pb-2"
                style={{
                  backgroundColor: '#f3f4f6',
                  backgroundImage:
                    "radial-gradient(600px 260px at 20% 10%, rgba(34,197,94,0.14), transparent 60%), radial-gradient(520px 240px at 85% 30%, rgba(16,185,129,0.10), transparent 62%), radial-gradient(560px 260px at 40% 88%, rgba(59,130,246,0.08), transparent 65%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23000000' stroke-opacity='0.05' stroke-width='2'%3E%3Cpath d='M-20 60 C 40 20, 80 100, 140 60 S 240 100, 300 60'/%3E%3Cpath d='M-20 120 C 40 80, 80 160, 140 120 S 240 160, 300 120'/%3E%3Cpath d='M-20 180 C 40 140, 80 220, 140 180 S 240 220, 300 180'/%3E%3C/g%3E%3Cg fill='%2322c55e' fill-opacity='0.04'%3E%3Ccircle cx='55' cy='55' r='28'/%3E%3Ccircle cx='175' cy='90' r='22'/%3E%3Ccircle cx='120' cy='170' r='30'/%3E%3C/g%3E%3C/svg%3E\")",
                  backgroundRepeat: 'repeat',
                  backgroundSize: 'auto, auto, auto, 240px 240px',
                }}
                onPointerDown={(e) => {
                  speakDragControls.start(e);
                }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-center"
                  aria-label="Resize"
                  onClick={() => {
                    setSpeakDrawerMode((m) => (m === 'half' ? 'full' : 'half'));
                  }}
                >
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{
                  backgroundColor: '#f3f4f6',
                  backgroundImage:
                    "radial-gradient(600px 260px at 20% 10%, rgba(34,197,94,0.14), transparent 60%), radial-gradient(520px 240px at 85% 30%, rgba(16,185,129,0.10), transparent 62%), radial-gradient(560px 260px at 40% 88%, rgba(59,130,246,0.08), transparent 65%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23000000' stroke-opacity='0.05' stroke-width='2'%3E%3Cpath d='M-20 60 C 40 20, 80 100, 140 60 S 240 100, 300 60'/%3E%3Cpath d='M-20 120 C 40 80, 80 160, 140 120 S 240 160, 300 120'/%3E%3Cpath d='M-20 180 C 40 140, 80 220, 140 180 S 240 220, 300 180'/%3E%3C/g%3E%3Cg fill='%2322c55e' fill-opacity='0.04'%3E%3Ccircle cx='55' cy='55' r='28'/%3E%3Ccircle cx='175' cy='90' r='22'/%3E%3Ccircle cx='120' cy='170' r='30'/%3E%3C/g%3E%3C/svg%3E\")",
                  backgroundRepeat: 'repeat',
                  backgroundSize: 'auto, auto, auto, 240px 240px',
                }}
              >
                <div className="space-y-3">
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={
                          m.role === 'user'
                            ? 'max-w-[85%] rounded-2xl bg-green-600 text-white px-4 py-2 text-sm shadow-sm'
                            : 'max-w-[85%] rounded-2xl bg-gray-100 text-gray-900 px-4 py-2 text-sm shadow-sm'
                        }
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="border-t border-gray-200 px-4 py-4 bg-white">
                {speechError && (
                  <div className="mb-2 text-xs text-red-600">{speechError}</div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    ref={speakInputRef}
                    value={speakText}
                    onChange={(e) => setSpeakText(e.target.value)}
                    placeholder={`Message ${process.env.NEXT_PUBLIC_APP_NAME || 'Gram Kushal'}...`}
                    className="h-11 rounded-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendSpeakMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={`h-11 w-11 rounded-full ${isRecording ? 'border-green-600 text-green-700 bg-green-50' : ''}`}
                    onClick={toggleRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className="h-11 w-11 rounded-full bg-green-600 hover:bg-green-700"
                    onClick={sendSpeakMessage}
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-up Menu Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-in-out"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide-up Panel */}
          <div className={`
            fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md rounded-t-2xl shadow-2xl border-t border-gray-200/50
            transform transition-all duration-500 ease-out
            ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
          `}>
            <div className="p-4">
              {/* Handle bar */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 transform transition-all duration-300 hover:bg-gray-400" />
              
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200/50">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                  <span className="text-white font-medium text-lg">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 transition-all duration-200">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 shadow-sm transform transition-all duration-200 hover:scale-105 ${
                    user.role === 'admin' 
                      ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300/50' 
                      : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Additional Menu Items */}
              <div className="space-y-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 w-full transition-all duration-300 ease-in-out transform hover:translate-x-1 hover:shadow-sm"
                >
                  <svg className="w-5 h-5 transition-transform duration-200 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
