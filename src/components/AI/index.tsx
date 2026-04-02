'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Mic, Send, Volume2, VolumeX, X, Headphones, PhoneOff, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useChatEngine } from './useChatEngine';
import { useVoiceEngine } from './useVoiceEngine';

export default function GramKushalAI() {
  const [isSpeakOpen, setIsSpeakOpen] = useState(false);
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
      const history = [...chatMessages, newUserMsg].slice(-10).map(m => ({ role: m.role, content: m.content}));
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

  const speakInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Close logic
  useEffect(() => {
    document.body.style.overflow = isSpeakOpen ? 'hidden' : '';
    if (!isSpeakOpen) {
      emergencyStopAudio();
    }
    return () => { document.body.style.overflow = ''; };
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
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-green-700 text-white text-xs rounded border border-green-500/50 px-1.5 py-1 outline-none appearance-none cursor-pointer"
                >
                  <option value="en-US">English</option>
                  <option value="hi-IN">हिंदी</option>
                  <option value="mr-IN">मराठी</option>
                </select>
                <button type="button" onClick={() => setIsSpeakOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3" style={{ backgroundColor: '#e8efe5' }}>
              <div className="space-y-2">
                {chatMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full min-h-[120px]">
                    <div className="text-center px-6">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center"><Mic className="w-7 h-7 text-green-600" /></div>
                      <p className="text-gray-600 text-sm font-medium">Welcome! {"\uD83D\uDC4B"}</p>
                      <p className="text-gray-500 text-xs mt-1">What can I help you with today?</p>
                    </div>
                  </div>
                )}

                {chatMessages.map(m => (
                  <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className="flex flex-col gap-1 max-w-[82%]">
                      <div className={m.role === 'user' ? 'rounded-2xl rounded-tr-sm bg-green-600 text-white px-3 py-2 text-[13px] leading-relaxed shadow-sm' : 'rounded-2xl rounded-tl-sm bg-white text-gray-800 px-3 py-2 text-[13px] leading-relaxed shadow-sm'}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                      {m.role === 'assistant' && (
                        <button type="button" onClick={() => handleTTS(m.content, m.id)} className={`self-start flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors ${speakingMsgId === m.id ? 'bg-green-100 text-green-700' : 'text-gray-400 bg-gray-100'}`}>
                          {speakingMsgId === m.id ? <><VolumeX className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Listen</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isAiLoading && <div className="text-center text-sm text-gray-500">Thinking...</div>}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className={`flex-shrink-0 border-t border-gray-200 px-3 py-2 ${isVoiceMode ? 'bg-gray-50' : 'bg-white'}`} style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
              {speechError && <div className="mb-1.5 text-xs text-red-600 px-1 text-center font-medium">{speechError}</div>}
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
                <div className="flex items-center gap-2">
                  <Input ref={speakInputRef} value={speakText} onChange={e => setSpeakText(e.target.value)} placeholder="Type a message..." className="h-10 rounded-full text-sm flex-1 bg-gray-50" disabled={isAiLoading} onKeyDown={e => { if (e.key === 'Enter') sendSpeakMessage(speakText, setSpeakText, selectedLanguage); }} />
                  {speakText.length === 0 ? <button type="button" onClick={() => toggleRecording(setSpeakText)} className="h-10 w-10 text-gray-500 hover:bg-gray-100 rounded-full flex items-center justify-center"><Mic className="w-5 h-5" /></button> : <button type="button" disabled={isAiLoading} onClick={() => sendSpeakMessage(speakText, setSpeakText, selectedLanguage)} className="h-10 w-10 bg-green-600 text-white rounded-full flex items-center justify-center"><Send className="w-5 h-5" /></button>}
                  <button type="button" onClick={toggleVoiceMode} className="h-10 w-10 text-gray-600 rounded-full flex items-center justify-center"><Headphones className="w-5 h-5" /></button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
