'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home as HomeIcon, BookOpen, Mic, Send, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);
  const speakInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const speakDragControls = useDragControls();
  const recognitionRef = useRef<any>(null);
  const lastSendRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const SEND_COOLDOWN_MS = 2000;
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

  const toggleRecording = async () => {
    setSpeechError(null);

    // Check if we're in a secure context (HTTPS or localhost) — required for mic on mobile
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setSpeechError('Microphone requires HTTPS. Please access the site via HTTPS.');
      return;
    }

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
      // Explicitly request microphone permission first — this triggers the browser prompt
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release the stream immediately — we just needed to trigger the permission prompt
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (micErr: any) {
      const errName = micErr?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (errName === 'NotFoundError') {
        setSpeechError('No microphone found. Please connect a microphone and try again.');
      } else {
        setSpeechError('Could not access microphone. Make sure the site is loaded over HTTPS.');
      }
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
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (err === 'no-speech') {
          setSpeechError('No speech detected. Please try again.');
        } else if (err === 'network') {
          setSpeechError('Network error during speech recognition. Check your internet connection.');
        } else if (err === 'aborted') {
          // User or system aborted — not an error to show
        } else {
          setSpeechError('Voice input failed. Please try again.');
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
      setSpeechError('Voice input failed to start. Please try again.');
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

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isSpeakOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSpeakOpen]);

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
    // Stop any ongoing TTS when drawer closes
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    setSpeakingMsgId(null);
  }, [isSpeakOpen]);

  // ── Text-to-Speech handler (uses Gemini TTS API for multilingual support) ──
  const ttsLoadingRef = useRef(false);
  const handleTTS = async (text: string, msgId: string) => {
    // If already speaking this message, stop it
    if (speakingMsgId === msgId) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      setSpeakingMsgId(null);
      return;
    }

    // Debounce: block if a TTS request is already in-flight
    if (ttsLoadingRef.current) return;
    ttsLoadingRef.current = true;
    setTtsLoadingMsgId(msgId);

    // Stop any other ongoing speech
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    // Strip markdown for clean speech
    const plainText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) → link text
      .replace(/[*_~`#>]/g, '')                 // remove markdown chars
      .replace(/\n+/g, '. ')                     // newlines → pauses
      .replace(/\s+/g, ' ')                      // collapse whitespace
      .trim();

    if (!plainText) {
      ttsLoadingRef.current = false;
      setTtsLoadingMsgId(null);
      return;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plainText }),
      });

      if (!res.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      audio.onended = () => {
        setSpeakingMsgId(null);
        URL.revokeObjectURL(url);
        ttsAudioRef.current = null;
      };
      audio.onerror = () => {
        setSpeakingMsgId(null);
        URL.revokeObjectURL(url);
        ttsAudioRef.current = null;
      };

      setSpeakingMsgId(msgId);
      await audio.play();
    } catch (err) {
      console.error('[TTS] Error:', err);
      setSpeakingMsgId(null);
    } finally {
      ttsLoadingRef.current = false;
      setTtsLoadingMsgId(null);
    }
  };

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

  const sendSpeakMessage = async () => {
    const text = speakText.trim();
    if (!text || isAiLoading) return;

    // Enforce 2-second cooldown between sends
    const now = Date.now();
    if (now - lastSendRef.current < SEND_COOLDOWN_MS) return;
    lastSendRef.current = now;

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newUserMsg: ChatMessage = { id, role: 'user', content: text };
    setChatMessages((prev) => [...prev, newUserMsg]);
    setSpeakText('');
    setIsAiLoading(true);

    try {
      // Send full conversation history (last 20 messages max) for context
      const history = [...chatMessages, newUserMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      const data = await res.json();
      const replyId = `${Date.now()}-${Math.random().toString(16).slice(2)}-a`;
      const replyText = res.ok
        ? data.reply
        : (data.error || 'Sorry, something went wrong. Please try again.');

      setChatMessages((prev) => [
        ...prev,
        { id: replyId, role: 'assistant', content: replyText },
      ]);
    } catch (err: any) {
      // Don't show error if the request was intentionally aborted
      if (err?.name === 'AbortError') return;
      const errId = `${Date.now()}-err`;
      setChatMessages((prev) => [
        ...prev,
        { id: errId, role: 'assistant', content: 'Network error. Please check your connection and try again.' },
      ]);
    } finally {
      setIsAiLoading(false);
    }
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
                setSpeakDrawerMode('full');
                /* TODO: wire voice action */
              }}
              aria-label="Gram Sathi"
              className="bg-white hover:bg-gray-50 rounded-full w-14 h-14 shadow-xl flex items-center justify-center ring-4 ring-white overflow-hidden"
            >
              <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                <Image src="/images/gramsathi.jpeg" alt="Gram Sathi" fill sizes="(max-width: 768px) 56px, 56px" className="object-cover" />
              </div>
            </button>
            <span className="mt-1 text-xs font-medium text-green-700">Gram Sathi</span>
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
              animate={{ y: 0, height: speakDrawerMode === 'full' ? '95vh' : '60vh' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 flex flex-col overflow-hidden"
              drag="y"
              dragListener={false}
              dragControls={speakDragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                const dy = info.offset.y;
                if (speakDrawerMode === 'half') {
                  if (dy < -80) {
                    setSpeakDrawerMode('full');
                  } else if (dy > 100) {
                    setIsSpeakOpen(false);
                  }
                } else {
                  if (dy > 200) {
                    setIsSpeakOpen(false);
                  } else if (dy > 80) {
                    setSpeakDrawerMode('half');
                  }
                }
              }}
            >
              {/* Drag Handle */}
              <div
                className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => {
                  speakDragControls.start(e);
                }}
              >
                <div className="flex items-center justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
              </div>

              {/* Chat Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-green-600">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{process.env.NEXT_PUBLIC_APP_NAME || 'Gram Kushal'} AI</h3>
                    <p className="text-green-100 text-xs">Ask me anything about the platform</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSpeakOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages Area */}
              <div
                className="flex-1 overflow-y-auto px-3 py-3"
                style={{ backgroundColor: '#e8efe5' }}
              >
                <div className="space-y-2">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[120px]">
                      <div className="text-center px-6">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                          <Mic className="w-7 h-7 text-green-600" />
                        </div>
                        <p className="text-gray-600 text-sm font-medium">Welcome! 👋</p>
                        <p className="text-gray-500 text-xs mt-1">What can I help you with today?</p>
                      </div>
                    </div>
                  )}
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div className="flex flex-col gap-1 max-w-[82%]">
                        <div
                          className={
                            m.role === 'user'
                              ? 'rounded-2xl rounded-tr-sm bg-green-600 text-white px-3 py-2 text-[13px] leading-relaxed shadow-sm'
                              : 'rounded-2xl rounded-tl-sm bg-white text-gray-800 px-3 py-2 text-[13px] leading-relaxed shadow-sm'
                          }
                        >
                          <div
                            className={`prose prose-sm max-w-none ${m.role === 'user' ? 'text-white prose-invert' : 'text-gray-800'
                              } prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 break-words`}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ node, ...props }) => (
                                  <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold no-underline transition-colors mx-1 ${m.role === 'user'
                                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                                      : 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-200'
                                      }`}
                                  >
                                    <span>🔗</span>
                                    {props.children}
                                  </a>
                                ),
                                p: ({ node, ...props }) => (
                                  <p {...props} className="m-0 leading-relaxed last:mb-0" />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul {...props} className="my-1 pl-4 list-disc marker:text-current" />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol {...props} className="my-1 pl-4 list-decimal marker:text-current" />
                                ),
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        {/* TTS speaker button for assistant messages */}
                        {m.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => handleTTS(m.content, m.id)}
                            disabled={ttsLoadingMsgId === m.id}
                            className={`self-start flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors ${ttsLoadingMsgId === m.id
                                ? 'text-gray-400 bg-gray-50 cursor-wait'
                                : speakingMsgId === m.id
                                  ? 'text-green-700 bg-green-100'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                            aria-label={speakingMsgId === m.id ? 'Stop speaking' : 'Read aloud'}
                          >
                            {ttsLoadingMsgId === m.id ? (
                              <><span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /><span>Loading...</span></>
                            ) : speakingMsgId === m.id ? (
                              <><VolumeX className="w-3.5 h-3.5" /><span>Stop</span></>
                            ) : (
                              <><Volume2 className="w-3.5 h-3.5" /><span>Listen</span></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-sm bg-white text-gray-500 px-4 py-3 text-sm shadow-sm flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Input Bar */}
              <div className="flex-shrink-0 border-t border-gray-200 px-3 py-2 bg-white" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
                {speechError && (
                  <div className="mb-1.5 text-xs text-red-600 px-1">{speechError}</div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    ref={speakInputRef}
                    value={speakText}
                    onChange={(e) => setSpeakText(e.target.value)}
                    placeholder={`Message ${process.env.NEXT_PUBLIC_APP_NAME || 'Gram Kushal'}...`}
                    className="h-10 rounded-full text-sm"
                    disabled={isAiLoading}
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
                    className={`h-10 w-10 rounded-full flex-shrink-0 ${isRecording ? 'border-green-600 text-green-700 bg-green-50' : ''}`}
                    onClick={toggleRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    className={`h-10 w-10 rounded-full flex-shrink-0 ${isAiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={isAiLoading}
                    onClick={sendSpeakMessage}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
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
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 shadow-sm transform transition-all duration-200 hover:scale-105 ${user.role === 'admin'
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
