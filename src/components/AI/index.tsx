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

  // Custom Audio Hardware Hook
  const {
    isRecording,
    toggleRecording,
    isVoiceMode,
    toggleVoiceMode,
    voiceModeStatus,
    voiceTranscript,
    stopSpeakingAndListen,
    handleTTS,
    speakingMsgId,
    ttsLoadingMsgId,
    emergencyStopAudio,
  } = useVoiceEngine(
    // Inject chat function into voice engine for continuous conversational mode
    async (text) => {
      // Very basic manual injection
      const newUserMsg = { id: Date.now().toString(), role: 'user' as const, content: text };
      const history = [...chatMessages, newUserMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, language: selectedLanguage }) });
      const data = await res.json();
      return data.reply || null;
    },
    // Inject append function
    (role, text) => {
      setChatMessages(prev => [...prev, { id: Date.now().toString() + role, role, content: text }]);
    },
    setSpeechError,
    selectedLanguage
  );

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
    if (isSpeakOpen) chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages, isSpeakOpen]);

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
            className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-green-600 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30"><Image src="/images/gramsathi.jpeg" alt="Gram Sathi" width={36} height={36} className="object-cover w-full h-full" /></div>
                <div>
                  <h3 className="text-white font-semibold text-sm">GramKushal AI</h3>
                  <p className="text-green-100 text-xs">Ask me anything about the platform</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={langDropdownRef}>
                  <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center gap-1.5 bg-green-700/50 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg px-2.5 py-1.5 transition-all outline-none border border-white/10"
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

                <motion.button
                  type="button"
                  onClick={handleNewChat}
                  title="New Chat"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.button>
                <button type="button" onClick={() => setIsSpeakOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>

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
                        {/* Outer Pulsing Rings */}
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

                        {/* Main Button */}
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

            <div className="flex-shrink-0 border-t border-white/20 px-3 py-2" style={{ backgroundColor: CARD_BG_COLOR, paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 py-1">
                    <span className="text-gray-600 text-xs font-semibold">{voiceModeStatus.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-white border border-gray-200 rounded-full h-12 px-4 flex items-center overflow-hidden shadow-inner">{voiceTranscript || '...'}</div>
                    <button type="button" onClick={toggleVoiceMode} className="w-20 h-12 flex-shrink-0 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"><PhoneOff className="w-4 h-4" /> End</button>
                  </div>
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
                          {isRecording ? (
                            <Square className="w-4 h-4 fill-current" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button type="button" disabled={isAiLoading} onClick={() => sendSpeakMessage(speakText, setSpeakText, selectedLanguage)} className="h-10 w-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-green-700 transition-all"><Send className="w-5 h-5" /></button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className="w-full h-11 flex items-center justify-center gap-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 border border-green-100 shadow-sm"
                  >
                    <AudioLines className="w-5 h-5" />
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
