'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Mic, Send, Volume2, VolumeX, X, Headphones, PhoneOff, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

// ── How long (ms) to wait for the Gemini TTS API before giving up and
//    falling back to instant browser speechSynthesis. Keep this tight —
//    the whole point is the user should NEVER wait more than ~4 seconds
//    for speech to start.
const TTS_API_TIMEOUT_MS = 4000;

// ── How long (ms) to pause between stopping one SpeechRecognition
//    session and starting the next one. Chrome needs this breathing
//    room or it silently fails to start the new instance, which causes
//    the "mic flickers on/off" bug after 3-4 conversations.
const RECOGNITION_RESTART_DELAY_MS = 250;

export default function GramKushalAI() {
  const [isSpeakOpen, setIsSpeakOpen] = useState(false);
  const [speakText, setSpeakText] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);

  const speakInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastSendRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const SEND_COOLDOWN_MS = 2000;

  // Mirror of chatMessages in a ref so we can read the freshest value
  // inside async callbacks without stale closures.
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // ── Voice mode ──
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceModeStatus, setVoiceModeStatus] = useState<VoiceStatus>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const voiceRecognitionRef = useRef<any>(null);
  const voiceSilenceTimerRef = useRef<any>(null);
  const voiceTranscriptRef = useRef('');
  const latestCombinedVoiceRef = useRef('');
  const isUserStoppedVoiceRef = useRef(false);
  const isVoiceModeMountedRef = useRef(false);
  const voiceTalkStatusRef = useRef<VoiceStatus>('idle');
  // Generation counter: incremented every time we create a new recognition
  // instance. The onend handler captures this value and only acts if it
  // still matches — this prevents zombie handlers from cascading restarts.
  const voiceGenRef = useRef(0);
  // When true, the TTS playback promise in handleVoiceSend resolves
  // immediately so we can skip straight to listening.
  const skipTtsRef = useRef(false);

  // ── Pre-warm browser TTS voices immediately on mount. ──
  // The first call to getVoices() on some browsers returns an empty array;
  // after the 'voiceschanged' event they become available. Pre-warming here
  // means there's no first-use delay when we fall back to browser TTS.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // ── Wrapper: keeps ref + state in sync atomically ──
  const setVoiceStatus = (status: VoiceStatus) => {
    voiceTalkStatusRef.current = status;
    setVoiceModeStatus(status);
  };

  // ── Lock body scroll while widget is open ──
  useEffect(() => {
    document.body.style.overflow = isSpeakOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSpeakOpen]);

  useEffect(() => {
    if (!isSpeakOpen) return;
    const t = window.setTimeout(() => speakInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isSpeakOpen]);

  useEffect(() => {
    if (isSpeakOpen) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsRecording(false);
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    setSpeakingMsgId(null);
  }, [isSpeakOpen]);

  useEffect(() => {
    if (!isSpeakOpen) return;
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages, isSpeakOpen]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      isVoiceModeMountedRef.current = false;
      if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
      safeStopRecognition(voiceRecognitionRef);
      if (ttsAudioRef.current) ttsAudioRef.current.pause();
      safeStopRecognition(recognitionRef);
    };
  }, []);

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────

  /** Safely stop a SpeechRecognition instance held in a ref, then null it. */
  function safeStopRecognition(ref: React.MutableRefObject<any>) {
    if (ref.current) {
      try { ref.current.stop(); } catch { /* ignore */ }
      ref.current = null;
    }
  }

  /**
   * Attempt to get TTS audio from the Gemini API with a hard timeout.
   * Returns an audio Blob on success, or null if the API is too slow / fails.
   * The caller should immediately fall back to browser speechSynthesis on null.
   *
   * PERF FIX: Previously there was no timeout, so a slow Gemini TTS call
   * would block the UI for 10-20 seconds. Now we give it exactly
   * TTS_API_TIMEOUT_MS (4s) before returning null and letting the browser
   * speak instantly instead.
   */
  async function fetchTTSWithTimeout(text: string): Promise<Blob | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_API_TIMEOUT_MS);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('audio')) return null;

      const blob = await res.blob();
      return blob.size > 100 ? blob : null;
    } catch {
      clearTimeout(timeoutId);
      return null; // timeout (AbortError) or network error → use browser TTS
    }
  }

  /**
   * Play text via browser's built-in speechSynthesis.
   * This is instant — no network call needed.
   */
  function speakViaBrowser(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const englishVoice = window.speechSynthesis
        .getVoices()
        .find(v => v.lang.toLowerCase().startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.rate = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  // ────────────────────────────────────────────────
  // Text-mode dictation mic
  // ────────────────────────────────────────────────
  const toggleRecording = async () => {
    setSpeechError(null);

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
      safeStopRecognition(recognitionRef);
      setIsRecording(false);
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
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

      recognition.onresult = (event: any) => {
        // Rebuild the FULL transcript from scratch on every onresult.
        // This avoids the doubling bug where accumulated finalTranscript
        // + appendedSpeakText would duplicate the same words.
        let fullFinal = '';
        let fullInterim = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const t = res?.[0]?.transcript ?? '';
          if (res.isFinal) fullFinal += t;
          else fullInterim += t;
        }
        const combined = (fullFinal + fullInterim).trim();
        if (combined) setSpeakText(combined);
      };

      recognition.onerror = (event: any) => {
        const err = typeof event?.error === 'string' ? event.error : 'unknown';
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (err === 'no-speech') {
          setSpeechError('No speech detected. Please try again.');
        } else if (err === 'network') {
          setSpeechError('Network error during speech recognition. Check your internet connection.');
        } else if (err !== 'aborted') {
          setSpeechError('Voice input failed. Please try again.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setSpeechError('Voice input failed to start. Please try again.');
      setIsRecording(false);
    }
  };

  // ────────────────────────────────────────────────
  // Voice mode — silence timer
  // ────────────────────────────────────────────────
  const resetVoiceSilenceTimer = () => {
    if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
    voiceSilenceTimerRef.current = setTimeout(() => {
      if (voiceTalkStatusRef.current === 'listening') {
        stopVoiceListeningAndSend();
      }
    }, 4000); // 4 seconds of silence after last word before auto-sending
  };

  // ────────────────────────────────────────────────
  // Voice mode — start listening
  // ────────────────────────────────────────────────
  const startVoiceListening = async (
    skipMicPermission = false,
    isAutoRestart = false,
  ) => {
    if (!isVoiceModeMountedRef.current) return;
    if (typeof window === 'undefined') return;
    setSpeechError(null);

    if (!isAutoRestart) {
      voiceTranscriptRef.current = '';
      latestCombinedVoiceRef.current = '';
      setVoiceTranscript('');
      isUserStoppedVoiceRef.current = false;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechError('Voice input is not supported in this browser.');
      return;
    }

    if (!skipMicPermission) {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
        }
      } catch {
        setSpeechError('Microphone permission denied.');
        setVoiceStatus('idle');
        return;
      }
      if (!isVoiceModeMountedRef.current) return;
    }

    // Kill any existing recognition before creating a new one.
    safeStopRecognition(voiceRecognitionRef);

    // Bump the generation counter BEFORE the delay so that any onend
    // handler from the old instance (which fires asynchronously after
    // old.stop()) will see a stale generation and become a no-op.
    voiceGenRef.current += 1;
    const myGen = voiceGenRef.current;

    // Wait for Chrome to fully release the previous recognition session.
    await new Promise(r => setTimeout(r, RECOGNITION_RESTART_DELAY_MS));

    // Bail if voice mode was turned off during the delay, or if another
    // startVoiceListening call has already bumped the generation.
    if (!isVoiceModeMountedRef.current || voiceGenRef.current !== myGen) return;

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = true;

      let sessionFinal = '';

      recognition.onresult = (event: any) => {
        if (voiceTalkStatusRef.current !== 'listening') return;

        let interim = '';
        sessionFinal = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const t = res?.[0]?.transcript ?? '';
          if (res.isFinal) sessionFinal += t;
          else interim += t;
        }
        const currentTotal = (voiceTranscriptRef.current + ' ' + sessionFinal).trim();
        const combined = (currentTotal + ' ' + interim).trim();

        if (combined) {
          latestCombinedVoiceRef.current = combined;
          setVoiceTranscript(combined);
        }

        resetVoiceSilenceTimer();
      };

      recognition.onerror = (event: any) => {
        const err = typeof event?.error === 'string' ? event.error : 'unknown';
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setSpeechError('Microphone permission denied.');
          setVoiceStatus('idle');
        }
        // Ignore 'no-speech' and 'aborted' — they're normal in continuous mode
      };

      recognition.onend = () => {
        // If a newer recognition instance has been created, this handler
        // belongs to a zombie — ignore it completely to prevent cascading
        // restart loops that cause the mic flicker bug.
        if (voiceGenRef.current !== myGen) return;

        if (sessionFinal) {
          voiceTranscriptRef.current = (voiceTranscriptRef.current + ' ' + sessionFinal).trim();
        }

        if (!isUserStoppedVoiceRef.current && voiceTalkStatusRef.current === 'listening') {
          // Chrome session timed out — auto-restart
          setTimeout(() => {
            if (isVoiceModeMountedRef.current && voiceGenRef.current === myGen) {
              startVoiceListening(true, true);
            }
          }, 50);
        } else if (voiceTalkStatusRef.current === 'listening') {
          setVoiceStatus('idle');
          voiceRecognitionRef.current = null;
        }
      };

      voiceRecognitionRef.current = recognition;
      recognition.start();
      setVoiceStatus('listening');
      // DON'T start silence timer here — wait for the first onresult.
      // On mobile, Chrome can take 3-5 seconds before first results arrive.
      // Starting the timer here would fire stopVoiceListeningAndSend before
      // any speech is captured, causing the mic to restart = on/off loop.
    } catch (e) {
      console.error('[VoiceMode] Failed to start:', e);
      setSpeechError('Voice input failed to start.');
    }
  };

  // ────────────────────────────────────────────────
  // Voice mode — stop and send
  // ────────────────────────────────────────────────
  const stopVoiceListeningAndSend = () => {
    if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);

    // Stop recognition immediately so no new results arrive during
    // the thinking/speaking phase.
    isUserStoppedVoiceRef.current = true;
    if (voiceRecognitionRef.current) {
      const old = voiceRecognitionRef.current;
      voiceRecognitionRef.current = null;
      try { old.stop(); } catch { /* ignore */ }
    }

    const text = latestCombinedVoiceRef.current.trim();
    latestCombinedVoiceRef.current = '';
    voiceTranscriptRef.current = '';

    if (text) {
      handleVoiceSend(text);
    } else {
      // Nothing captured — restart listening
      isUserStoppedVoiceRef.current = false;
      startVoiceListening(true, false);
    }
  };

  // ────────────────────────────────────────────────
  // Voice mode — stop speaking and start listening
  // ────────────────────────────────────────────────
  const stopSpeakingAndListen = () => {
    // Set the flag so the TTS promise in handleVoiceSend resolves early
    skipTtsRef.current = true;

    // Stop API audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    // Stop browser TTS
    window.speechSynthesis?.cancel();
  };

  // ────────────────────────────────────────────────
  // Voice mode — send to AI and speak reply
  // ────────────────────────────────────────────────
  const handleVoiceSend = async (transcript: string) => {
    const text = transcript.trim();
    if (!text || !isVoiceModeMountedRef.current) return;

    skipTtsRef.current = false;
    setVoiceTranscript('');
    setVoiceStatus('thinking');

    const userMsg: ChatMessage = {
      id: `voice-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const latestHistory = [...chatMessagesRef.current];
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const history = [...latestHistory, userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      const replyText = res.ok ? data.reply : 'Sorry, something went wrong.';

      if (!isVoiceModeMountedRef.current) return;

      setChatMessages(prev => [
        ...prev,
        { id: `voice-${Date.now()}-a`, role: 'assistant', content: replyText },
      ]);
      setVoiceStatus('speaking');

      const plainText = replyText
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~`#>]/g, '')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      // Skip TTS entirely if user already tapped Stop
      if (!skipTtsRef.current) {
        const blob = await fetchTTSWithTimeout(plainText);

        if (blob && isVoiceModeMountedRef.current && !skipTtsRef.current) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          ttsAudioRef.current = audio;
          await new Promise<void>(resolve => {
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            // Check skipTtsRef periodically so we break out fast
            const checkSkip = setInterval(() => {
              if (skipTtsRef.current) {
                clearInterval(checkSkip);
                resolve();
              }
            }, 100);
            audio.play().catch(() => { clearInterval(checkSkip); resolve(); });
          });
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
        } else if (isVoiceModeMountedRef.current && !skipTtsRef.current) {
          await speakViaBrowser(plainText);
        }
      }

      // Restart listening after TTS finishes (or was skipped)
      if (isVoiceModeMountedRef.current) {
        skipTtsRef.current = false;
        isUserStoppedVoiceRef.current = false;
        startVoiceListening(true, false);
      }
    } catch (error) {
      setSpeechError('Failed to send message.');
      setVoiceStatus('idle');
    }
  };

  // ────────────────────────────────────────────────
  // Toggle voice mode on/off
  // ────────────────────────────────────────────────
  const toggleVoiceMode = () => {
    // Unlock audio context on mobile (must be done in a user gesture handler)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const unlock = new SpeechSynthesisUtterance('');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }

    if (isVoiceMode) {
      setIsVoiceMode(false);
      isVoiceModeMountedRef.current = false;
      isUserStoppedVoiceRef.current = true;
      if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
      safeStopRecognition(voiceRecognitionRef);
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setVoiceStatus('idle');
    } else {
      setIsSpeakOpen(true);
      setIsVoiceMode(true);
      isVoiceModeMountedRef.current = true;
      startVoiceListening(false, false);
    }
  };

  // ────────────────────────────────────────────────
  // Text-mode "Listen" TTS button
  // ────────────────────────────────────────────────
  const ttsLoadingRef = useRef(false);

  const handleTTS = async (text: string, msgId: string) => {
    // Toggle off if already speaking this message
    if (speakingMsgId === msgId) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }

    if (ttsLoadingRef.current) return;
    ttsLoadingRef.current = true;
    setTtsLoadingMsgId(msgId);

    // Stop any other ongoing speech first
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    const plainText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~`#>]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) {
      ttsLoadingRef.current = false;
      setTtsLoadingMsgId(null);
      return;
    }

    // ── PERF FIX: Race Gemini TTS against the 4s timeout.
    //    The user sees "Loading..." for at most 4 seconds, then
    //    speech starts instantly via browser fallback if Gemini is slow.
    const blob = await fetchTTSWithTimeout(plainText);

    ttsLoadingRef.current = false;
    setTtsLoadingMsgId(null);

    if (blob) {
      // Gemini TTS succeeded in time
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
      await audio.play().catch(() => {
        // If playback fails, fall through to browser TTS below
        setSpeakingMsgId(null);
        URL.revokeObjectURL(url);
        ttsAudioRef.current = null;
      });
    } else {
      // Gemini timed out or failed — speak instantly with browser TTS
      setSpeakingMsgId(msgId);
      await speakViaBrowser(plainText);
      setSpeakingMsgId(null);
    }
  };

  // ────────────────────────────────────────────────
  // Text chat send
  // ────────────────────────────────────────────────
  const sendSpeakMessage = async () => {
    const text = speakText.trim();
    if (!text || isAiLoading) return;

    const now = Date.now();
    if (now - lastSendRef.current < SEND_COOLDOWN_MS) return;
    lastSendRef.current = now;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newUserMsg: ChatMessage = { id, role: 'user', content: text };
    setChatMessages(prev => [...prev, newUserMsg]);
    setSpeakText('');
    setIsAiLoading(true);

    try {
      const history = [...chatMessagesRef.current, newUserMsg]
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

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
        : data.error || 'Sorry, something went wrong. Please try again.';

      setChatMessages(prev => [
        ...prev,
        { id: replyId, role: 'assistant', content: replyText },
      ]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setChatMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content: 'Network error. Please check your connection and try again.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsSpeakOpen(true)}
        aria-label="Gram Sathi AI"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg ring-4 ring-white overflow-hidden hover:shadow-xl transition-shadow duration-200"
      >
        <Image
          src="/images/gramsathi.jpeg"
          alt="Gram Sathi"
          width={56}
          height={56}
          className="object-cover w-full h-full"
        />
      </button>

      {/* Floating Chat Widget */}
      <AnimatePresence>
        {isSpeakOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-green-600 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30 flex-shrink-0">
                  <Image
                    src="/images/gramsathi.jpeg"
                    alt="Gram Sathi"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {process.env.NEXT_PUBLIC_APP_NAME || 'GramKushal'} AI
                  </h3>
                  <p className="text-green-100 text-xs">Ask me anything about the platform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSpeakOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
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

                {chatMessages.map(m => (
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
                            <>
                              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : speakingMsgId === m.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
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
            <div
              className={`flex-shrink-0 border-t border-gray-200 px-3 py-2 ${isVoiceMode ? 'bg-gray-50' : 'bg-white'}`}
              style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
            >
              {speechError && (
                <div className="mb-1.5 text-xs text-red-600 px-1 text-center font-medium">
                  {speechError}
                </div>
              )}

              {isVoiceMode ? (
                <div className="flex flex-col gap-2">
                  {/* Status indicator */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    {voiceModeStatus === 'listening' && (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-green-700 text-xs font-semibold">Listening (auto-sends on pause)...</span>
                      </>
                    )}
                    {voiceModeStatus === 'thinking' && (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                        <span className="text-amber-700 text-xs font-semibold">Understanding...</span>
                      </>
                    )}
                    {voiceModeStatus === 'speaking' && (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                        </span>
                        <span className="text-blue-700 text-xs font-semibold">Speaking...</span>
                        <button
                          type="button"
                          onClick={stopSpeakingAndListen}
                          className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 transition-colors active:scale-95"
                          aria-label="Stop speaking"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          Stop
                        </button>
                      </>
                    )}
                    {voiceModeStatus === 'idle' && (
                      <span className="text-gray-500 text-xs font-medium">Paused. Tap End to exit.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    {/* Live transcript display */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-full h-12 px-4 flex items-center overflow-hidden shadow-inner">
                      <span className="text-sm font-medium text-gray-700 truncate w-full">
                        {voiceTranscript ||
                          (voiceModeStatus === 'speaking'
                            ? 'Responding...'
                            : 'Listening...')}
                      </span>
                    </div>

                    {/* End call button */}
                    <button
                      type="button"
                      onClick={toggleVoiceMode}
                      className="w-20 h-12 flex-shrink-0 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                    >
                      {voiceModeStatus === 'listening' ? (
                        <div className="flex gap-0.5 items-center justify-center w-4 h-4">
                          <span className="w-1 bg-white rounded-full h-3 animate-pulse" />
                          <span className="w-1 bg-white rounded-full h-4 animate-pulse delay-75" />
                          <span className="w-1 bg-white rounded-full h-2 animate-pulse delay-150" />
                        </div>
                      ) : (
                        <PhoneOff className="w-4 h-4" />
                      )}
                      <span className="text-sm font-bold pr-1">End</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    ref={speakInputRef}
                    value={speakText}
                    onChange={e => setSpeakText(e.target.value)}
                    placeholder={`Message ${process.env.NEXT_PUBLIC_APP_NAME || 'Gram Kushal'}...`}
                    className="h-10 rounded-full text-sm flex-1 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-green-500"
                    disabled={isAiLoading}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendSpeakMessage();
                      }
                    }}
                  />

                  {speakText.length === 0 ? (
                    <button
                      type="button"
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isRecording
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      onClick={toggleRecording}
                      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isAiLoading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                        }`}
                      disabled={isAiLoading}
                      onClick={sendSpeakMessage}
                      aria-label="Send"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                    title="Enter Voice Mode"
                  >
                    <Headphones className="w-5 h-5" />
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