'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Mic, Send, Volume2, VolumeX, X, Headphones, PhoneOff, Square, Loader2, AudioLines, Sprout, BookOpen, ShoppingCart, RefreshCw, ChevronDownIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useChatEngine } from './useChatEngine';
import { useVoiceEngine } from './useVoiceEngine';
import { useLiveVoiceEngine } from './useLiveVoiceEngine';

export default function GramKushalAI() {
  const CARD_BG_COLOR = '#cff0cbff'; // Lighter, cleaner mint-white
  const [isSpeakOpen, setIsSpeakOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [speakText, setSpeakText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  // Custom API Logic Hook
  const {
    chatMessages,
    setChatMessages,
    isAiLoading,
    speechError,
    setSpeechError,
    sendSpeakMessage,
  } = useChatEngine();

  // Text chat audio features (dictation mic, TTS playback for chat bubbles)
  const {
    isRecording,
    toggleRecording,
    handleTTS,
    speakingMsgId,
    ttsLoadingMsgId,
    emergencyStopAudio: chatEmergencyStop,
  } = useVoiceEngine(
    async (text) => {
      const newUserMsg = { id: Date.now().toString(), role: 'user' as const, content: text };
      const history = [...chatMessages, newUserMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, language: selectedLanguage }) });
      const data = await res.json();
      return data.reply || null;
    },
    (role, text) => {
      setChatMessages(prev => [...prev, { id: Date.now().toString() + role, role, content: text }]);
    },
    setSpeechError,
    selectedLanguage
  );

  // 🚀 Gemini Live API Voice Engine (WebSocket-based, sub-second latency)
  const {
    isVoiceMode,
    toggleVoiceMode,
    voiceModeStatus,
    voiceTranscript,
    aiTranscript,
    stopSpeakingAndListen,
    emergencyStopAudio: liveEmergencyStop,
  } = useLiveVoiceEngine(selectedLanguage, setSpeechError);

  // Combined emergency stop
  const emergencyStopAudio = () => {
    chatEmergencyStop();
    liveEmergencyStop();
  };

  const handleNewChat = () => {
    setChatMessages([]);
    setSpeakText('');
    setSpeechError(null);
    emergencyStopAudio();
    if (isVoiceMode) toggleVoiceMode();
  };

  const speakInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);

  // Click outside listener for language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    if (isLangOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen]);

  // Close logic: Robust scroll lock on both body and html
  useEffect(() => {
    if (isSpeakOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      emergencyStopAudio();
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isSpeakOpen]);

  useEffect(() => {
    if (isSpeakOpen) window.setTimeout(() => speakInputRef.current?.focus(), 0);
  }, [isSpeakOpen]);

  useEffect(() => {
    if (isSpeakOpen && !isVoiceMode) chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages, isSpeakOpen, isVoiceMode]);

  // Futuristic SoundWave Sub-component
  const SoundWave = ({ status }: { status: string }) => {
    const isConnecting = status === 'connecting';
    const isSpeaking = status === 'speaking';
    const isListening = status === 'listening';
    const isActive = isSpeaking || isListening || isConnecting;

    return (
      <div className="relative w-full h-32 flex items-center justify-center overflow-hidden">
        {/* Edge-fading Mask Overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, #fcfdfc 0%, transparent 15%, transparent 85%, #fcfdfc 100%)'
          }}
        />

        {/* State-dependent Aura Glow */}
        <motion.div
          animate={{
            scale: isActive ? [1, 1.3, 1] : 1,
            opacity: isActive ? [0.2, 0.4, 0.2] : 0.15,
            backgroundColor: isSpeaking ? "rgba(16, 185, 129, 0.12)" : isListening ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)"
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 h-28 blur-[90px] rounded-full"
        />

        <svg
          viewBox="0 0 200 60"
          className={`w-full h-full transition-all duration-700 ${isSpeaking ? 'scale-y-110' : 'scale-100'}`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.2))' }}
        >
          {[
            { color: "#059669", opacity: 0.2, dur: 2.2, sw: 1 },
            { color: "#10b981", opacity: 0.4, dur: 1.8, sw: 1.2 },
            { color: "#34d399", opacity: 0.7, dur: 1.4, sw: 1.5 },
            { color: "#10b981", opacity: 0.9, dur: 1.1, sw: 2 }
          ].map((wave, i) => (
            <motion.path
              key={i}
              fill="none"
              stroke={wave.color}
              strokeWidth={isActive ? wave.sw : 1}
              strokeLinecap="round"
              opacity={wave.opacity}
              animate={{
                d: isSpeaking
                  ? [
                    `M0 30 Q25 ${30 - (i + 1) * 5}, 50 30 T100 30 T150 30 T200 30`,
                    `M0 30 Q25 ${30 + (i + 1) * 8}, 50 30 T100 30 T150 30 T200 30`,
                    `M0 30 Q25 ${30 - (i + 1) * 5}, 50 30 T100 30 T150 30 T200 30`
                  ]
                  : [
                    `M0 30 Q50 ${30 - (isActive ? i * 3 : 0)}, 100 30 T200 30`,
                    `M0 30 Q50 ${30 + (isActive ? i * 3 : 0)}, 100 30 T200 30`,
                    `M0 30 Q50 ${30 - (isActive ? i * 3 : 0)}, 100 30 T200 30`
                  ]
              }}
              transition={{
                duration: isSpeaking ? wave.dur : isConnecting ? 4 : 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15
              }}
            />
          ))}
        </svg>
      </div>
    );
  };

  const VoiceVisualizer = () => {
    const status = voiceModeStatus;
    const isActive = status === 'speaking' || status === 'listening';

    return (
      <div className="flex-1 flex flex-col pt-12 pb-8 relative overflow-hidden px-8">
        {/* Futuristic Background Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              opacity: status === 'speaking' ? [0.1, 0.2, 0.1] : 0.1,
              scale: status === 'speaking' ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -top-24 -left-24 w-64 h-64 bg-green-600/10 blur-[100px] rounded-full"
          />
          <motion.div
            animate={{
              opacity: status === 'listening' ? [0.1, 0.2, 0.1] : 0.1,
              scale: status === 'listening' ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
            className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"
          />
        </div>

        <div className="relative z-10 flex flex-col h-full items-center justify-between gap-8">
          {/* Top Text Feedback */}
          <div className="w-full text-center space-y-6 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {status === 'listening' && (
                <motion.div
                  key="listening-text"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-3"
                >
                  <p className="text-emerald-600 font-extrabold text-[11px] uppercase tracking-[0.3em] opacity-80">Listening Mode Active</p>
                  <p className="text-gray-800 text-lg font-medium leading-relaxed px-4 line-clamp-3">
                    &ldquo;{voiceTranscript || "How can I help you?"}&rdquo;
                  </p>
                </motion.div>
              )}
              {status === 'connecting' && (
                <motion.div
                  key="connecting-text"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-green-600 font-extrabold text-[11px] uppercase tracking-[0.3em] animate-pulse">Connecting to AI...</p>
                </motion.div>
              )}
              {status === 'speaking' && (
                <motion.div
                  key="speaking-text"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4"
                >
                  <p className="text-emerald-700 font-extrabold text-[11px] uppercase tracking-[0.3em] opacity-80">AI Responding</p>
                  {aiTranscript && (
                    <div className="px-2">
                      <p className="text-emerald-800 text-[16px] leading-relaxed font-semibold italic opacity-95 line-clamp-4">
                        &ldquo;{aiTranscript}&rdquo;
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
              {status === 'idle' && (
                <motion.div
                  key="idle-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-gray-500 font-extrabold text-[11px] uppercase tracking-[0.3em]">Voice Assistant Ready</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center Soundwave Visualizer */}
          <div className="flex-1 w-full flex items-center justify-center py-4">
            <SoundWave status={status} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSpeakOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg ring-4 ring-white overflow-hidden hover:shadow-xl transition-shadow duration-200"
      >
        <Image src="/images/gramsathi.jpeg" alt="Gram Sathi" width={56} height={56} className="object-cover w-full h-full" />
      </button>

      <AnimatePresence>
        {isSpeakOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSpeakOpen(false)}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-md transition-all duration-500"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSpeakOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className={`fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[550px] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-500 ${isVoiceMode
                ? 'bg-[#fcfdfc] border-green-100 shadow-green-900/10 shadow-2xl'
                : 'bg-white border-gray-200'
              }`}
          >
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-4 py-3 rounded-t-2xl transition-all duration-500 ${isVoiceMode ? 'bg-white border-b border-green-50' : 'bg-green-600'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${isVoiceMode ? 'ring-green-100' : 'ring-white/30'}`}>
                  <Image src="/images/gramsathi.jpeg" alt="Gram Sathi" width={36} height={36} className="object-cover w-full h-full" />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isVoiceMode ? 'text-gray-800' : 'text-white'}`}>GramKushal AI</h3>
                  <p className={`text-xs ${isVoiceMode ? 'text-green-600' : 'text-green-100'}`}>
                    {isVoiceMode ? 'Voice Mode Active' : 'Ask me anything about the platform'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={langDropdownRef}>
                  <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1.5 transition-all outline-none border ${isVoiceMode
                        ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                        : 'bg-green-700/50 hover:bg-green-700 text-white border-white/10'
                      }`}
                  >
                    <span>{selectedLanguage === 'en-US' ? 'English' : selectedLanguage === 'hi-IN' ? 'हिंदी' : 'मराठी'}</span>
                    <motion.span animate={{ rotate: isLangOpen ? 180 : 0 }}>
                      <ChevronDownIcon className="w-3 h-3 opacity-70" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isLangOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full right-0 mt-1.5 w-24 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60] py-1"
                      >
                        {[
                          { code: 'en-US', label: 'English' },
                          { code: 'hi-IN', label: 'हिंदी' },
                          { code: 'mr-IN', label: 'मराठी' }
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang.code);
                              setIsLangOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-[12px] font-bold transition-colors ${selectedLanguage === lang.code
                              ? 'bg-green-50 text-green-700'
                              : 'text-gray-600 hover:bg-green-500 hover:text-white'
                              }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isVoiceMode && (
                  <motion.button
                    type="button"
                    onClick={handleNewChat}
                    title="New Chat"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSpeakOpen(false)}
                  aria-label="Close"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ${isVoiceMode ? 'text-gray-400 hover:bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {isVoiceMode ? (
              <VoiceVisualizer />
            ) : (
              <div className={`flex-1 overflow-y-auto ${chatMessages.length === 0 ? 'overflow-hidden' : ''} px-3 py-3 scrollbar-premium`} style={{ backgroundColor: CARD_BG_COLOR }}>
                <div className="space-y-2">
                  {chatMessages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full py-2"
                    >
                      <div className="relative mb-4">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-green-300 rounded-full blur-2xl"
                        />
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-green-400/30 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute inset-0 bg-green-400/20 rounded-full"
                          />
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-xl flex items-center justify-center border-4 border-white/20"
                          >
                            <Mic className="w-10 h-10 text-white" />
                          </motion.div>
                        </div>
                      </div>

                      <div className="text-center px-6 mb-4">
                        <h2 className="text-gray-800 text-xl font-extrabold tracking-tight">
                          {(() => {
                            const hour = new Date().getHours();
                            if (hour < 12) return 'Good Morning ☀️';
                            if (hour < 17) return 'Good Afternoon 🌤️';
                            return 'Good Evening 🌙';
                          })()}
                        </h2>
                        <p className="text-gray-500 text-xs mt-1 font-medium italic">How can I help you today?</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[320px]">
                        {[
                          { text: "Farming Tips", icon: Sprout },
                          { text: "My Courses", icon: BookOpen },
                          { text: "How to buy?", icon: ShoppingCart }
                        ].map((tip, i) => (
                          <motion.button
                            key={tip.text}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            onClick={() => sendSpeakMessage(tip.text, setSpeakText, selectedLanguage)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-green-600/30 rounded-full text-[11px] text-green-700 font-bold shadow-sm hover:bg-green-50 transition-all active:scale-95"
                          >
                            <tip.icon className="w-3.5 h-3.5 text-green-600" />
                            <span>{tip.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {chatMessages.map(m => (
                    <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className="flex flex-col gap-1 max-w-[82%]">
                        <div className={m.role === 'user'
                          ? 'rounded-2xl rounded-tr-sm bg-green-600 text-white px-3 py-2 text-[13px] leading-relaxed shadow-sm overflow-x-auto whitespace-pre-wrap break-words scrollbar-premium'
                          : 'rounded-2xl rounded-tl-sm bg-white text-gray-800 px-3 py-2 text-[13px] leading-relaxed shadow-md overflow-x-auto whitespace-pre-wrap break-words scrollbar-premium border border-gray-100'
                        }>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                        {m.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => handleTTS(m.content, m.id)}
                            className={`self-start flex items-center justify-center overflow-hidden h-6 min-w-[70px] px-3 rounded-full text-[11px] font-medium transition-all duration-300 ${speakingMsgId === m.id
                              ? 'bg-green-100 text-green-700 shadow-sm ring-1 ring-green-200'
                              : ttsLoadingMsgId === m.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-500 bg-white/80 hover:bg-white hover:text-gray-700 shadow-sm border border-gray-100'
                              }`}
                          >
                            <AnimatePresence mode="wait">
                              {ttsLoadingMsgId === m.id ? (
                                <motion.div
                                  key="loading"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1.5"
                                >
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Processing</span>
                                </motion.div>
                              ) : speakingMsgId === m.id ? (
                                <motion.div
                                  key="stop"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1"
                                >
                                  <VolumeX className="w-3 h-3" />
                                  <span>Stop</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="listen"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center gap-1"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Listen</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm flex items-center gap-1.5 border border-gray-100">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`flex-shrink-0 border-t px-3 py-2 transition-all duration-500 ${isVoiceMode ? 'bg-white border-green-50' : 'border-white/20'
              }`} style={{ backgroundColor: isVoiceMode ? 'white' : CARD_BG_COLOR, paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
              {speechError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2 mx-1 p-2.5 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between text-[11px] text-red-700 font-medium"
                >
                  <span className="flex-1 text-center">{speechError}</span>
                  <button onClick={() => setSpeechError(null)} className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors">
                    <X size={12} className="text-red-500" />
                  </button>
                </motion.div>
              )}
              {isVoiceMode ? (
                <div className="flex flex-col gap-3 py-2">
                  <AnimatePresence>
                    {(voiceModeStatus === 'speaking' || voiceModeStatus === 'connecting') && (
                      <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={stopSpeakingAndListen}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-center gap-3 font-bold transition-all shadow-lg shadow-green-500/20"
                      >
                        <Square className="w-4 h-4 fill-current opacity-90" />
                        <span className="tracking-tight">Stop & Listen</span>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: '#fee2e2' }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={toggleVoiceMode}
                    className="w-full h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-3 font-bold transition-all border border-red-100"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span className="tracking-tight">End Voice Session</span>
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      ref={speakInputRef}
                      value={speakText}
                      onChange={e => setSpeakText(e.target.value)}
                      placeholder="Type a message..."
                      className="h-11 rounded-full text-sm flex-1 bg-white border-gray-300 focus:ring-green-500/20 shadow-sm"
                      disabled={isAiLoading}
                      onKeyDown={e => { if (e.key === 'Enter') sendSpeakMessage(speakText, setSpeakText, selectedLanguage); }}
                    />
                    {speakText.length === 0 ? (
                      <div className="relative flex items-center justify-center">
                        {isRecording && (
                          <>
                            <motion.div
                              initial={{ scale: 1, opacity: 0.6 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                              className="absolute inset-0 bg-red-400 rounded-full"
                            />
                            <motion.div
                              initial={{ scale: 1, opacity: 0.4 }}
                              animate={{ scale: 1.4, opacity: 0 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                              className="absolute inset-0 bg-red-400 rounded-full"
                            />
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleRecording(setSpeakText)}
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${isRecording
                            ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-200'
                            : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                          {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                        </button>
                      </div>
                    ) : (
                      <button type="button" disabled={isAiLoading} onClick={() => sendSpeakMessage(speakText, setSpeakText, selectedLanguage)} className="h-10 w-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-green-700 transition-all"><Send className="w-5 h-5" /></button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className="w-full h-11 flex items-center justify-center gap-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 border border-green-100 shadow-sm shadow-green-900/5"
                  >
                    <Headphones className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-tight">Open Voice Assistant</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
