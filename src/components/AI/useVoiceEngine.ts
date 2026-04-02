import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './useChatEngine';

export type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

const TTS_API_TIMEOUT_MS = 30000;
const RECOGNITION_RESTART_DELAY_MS = 250;

/**
 * LOW LEVEL EXPLANATION:
 * This custom hook isolates all the raw browser audio APIs.
 * It manually talks to the computer's microphone via window.SpeechRecognition
 * and manually talks to the computer's speakers via window.speechSynthesis.
 */
export function useVoiceEngine(
  sendChatToApi: (text: string) => Promise<string | null>,
  appendToChat: (role: 'user' | 'assistant', text: string) => void,
  setSpeechError: (err: string | null) => void,
  language: string = 'en-US'
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceModeStatus, setVoiceModeStatus] = useState<VoiceStatus>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Audio state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);

  // Raw hardware connection references
  const recognitionRef = useRef<any>(null);
  const voiceRecognitionRef = useRef<any>(null);
  const ttsAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceSilenceTimerRef = useRef<any>(null);

  const voiceTranscriptRef = useRef('');
  const latestCombinedVoiceRef = useRef('');
  const isUserStoppedVoiceRef = useRef(false);
  const isVoiceModeMountedRef = useRef(false);
  const voiceTalkStatusRef = useRef<VoiceStatus>('idle');
  const voiceGenRef = useRef(0);
  const skipTtsRef = useRef(false);
  const ttsLoadingRef = useRef(false);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);


  // Preheat the browser's built-in hidden voices immediately
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Sync refs so callbacks don't read old data
  const setVoiceStatus = (status: VoiceStatus) => {
    voiceTalkStatusRef.current = status;
    setVoiceModeStatus(status);
  };

  function safeStopRecognition(ref: React.MutableRefObject<any>) {
    // Cut the hardware microphone connection cleanly
    if (ref.current) {
      try { ref.current.stop(); } catch { /* ignore */ }
      ref.current = null;
    }
  }

  // Raw HTTP request to fetch audio WAV bytes
  async function fetchTTSBuffer(text: string, signal?: AbortSignal): Promise<ArrayBuffer | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_API_TIMEOUT_MS);

    // If an external signal is provided, abort our internal controller if it aborts
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

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

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 100) return null;
      return buffer;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name !== 'AbortError') {
        console.warn('[TTS Client] Fetch error:', err);
      }
      return null;
    }
  }

  // Play audio using Web Audio API (bypasses CSP restrictions on blob:/data: URLs)
  function playAudioBuffer(wavBuffer: ArrayBuffer): Promise<void> {
    return new Promise<void>(async (resolve) => {
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const audioBuffer = await ctx.decodeAudioData(wavBuffer.slice(0));
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        ttsAudioRef.current = source;
        source.onended = () => {
          ttsAudioRef.current = null;
          resolve();
        };
        source.start(0);
      } catch (err) {
        console.error('[TTS Client] AudioContext playback error:', err);
        ttsAudioRef.current = null;
        resolve();
      }
    });
  }

  function stopAudioPlayback() {
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.stop(); } catch {}
      ttsAudioRef.current = null;
    }
  }

  // Instant offline text-to-speech built directly into Chrome/Safari
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

  // Triggered when user wants to speak a single chat bubble
  const handleTTS = async (text: string, msgId: string) => {
    // If clicking the same message that is already speaking, just stop it.
    if (speakingMsgId === msgId) {
      stopAudioPlayback();
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // INTERRUPT: Cancel any previous pending request
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
    }
    
    // Create new controller for this request
    const controller = new AbortController();
    ttsAbortControllerRef.current = controller;

    setSpeechError(null);
    setTtsLoadingMsgId(msgId);
    ttsLoadingRef.current = true;

    // Stop current audio/speech immediately
    stopAudioPlayback();
    window.speechSynthesis?.cancel();

    const plainText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~`#>]/g, '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();

    if (!plainText) {
      setTtsLoadingMsgId(null);
      ttsLoadingRef.current = false;
      return;
    }

    try {
      const wavBuffer = await fetchTTSBuffer(plainText, controller.signal);
      
      // Safety check: only proceed if this specific request is still the active one
      if (controller.signal.aborted || ttsAbortControllerRef.current !== controller) return;

      setTtsLoadingMsgId(null);
      ttsLoadingRef.current = false;
      ttsAbortControllerRef.current = null;

      if (wavBuffer) {
        setSpeakingMsgId(msgId);
        await playAudioBuffer(wavBuffer);
        // Important: Only clear the global ID if it's still us
        setSpeakingMsgId(prev => prev === msgId ? null : prev);
      } else {
        setSpeakingMsgId(msgId);
        await speakViaBrowser(plainText);
        setSpeakingMsgId(prev => prev === msgId ? null : prev);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && ttsAbortControllerRef.current === controller) {
        setTtsLoadingMsgId(null);
        ttsLoadingRef.current = false;
        ttsAbortControllerRef.current = null;
      }
    }
  };

  // ----- HANDS-FREE VOICE ASSISTANT CORD -----

  const stopSpeakingAndListen = () => {
    skipTtsRef.current = true;
    stopAudioPlayback();
    window.speechSynthesis?.cancel();
  };

  const handleVoiceSend = async (transcript: string) => {
    const text = transcript.trim();
    if (!text || !isVoiceModeMountedRef.current) return;

    skipTtsRef.current = false;
    setVoiceTranscript('');
    setVoiceStatus('thinking');

    // Display user text immediately
    appendToChat('user', text);

    try {
      // Fetch the response from the chat server
      const replyText = await sendChatToApi(text);
      if (!isVoiceModeMountedRef.current || !replyText) return;

      appendToChat('assistant', replyText);
      setVoiceStatus('speaking');

      const plainText = replyText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~`#>]/g, '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();

      if (!skipTtsRef.current) {
        const wavBuf = await fetchTTSBuffer(plainText);
        if (wavBuf && isVoiceModeMountedRef.current && !skipTtsRef.current) {
          await new Promise<void>(resolve => {
            const checkSkip = setInterval(() => {
              if (skipTtsRef.current) {
                stopAudioPlayback();
                clearInterval(checkSkip);
                resolve();
              }
            }, 100);
            playAudioBuffer(wavBuf).then(() => {
              clearInterval(checkSkip);
              resolve();
            });
          });
        } else if (isVoiceModeMountedRef.current && !skipTtsRef.current) {
          await speakViaBrowser(plainText);
        }
      }

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

  const stopVoiceListeningAndSend = () => {
    if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
    isUserStoppedVoiceRef.current = true;

    if (voiceRecognitionRef.current) {
      const old = voiceRecognitionRef.current;
      voiceRecognitionRef.current = null;
      try { old.stop(); } catch { }
    }

    const text = latestCombinedVoiceRef.current.trim();
    latestCombinedVoiceRef.current = '';
    voiceTranscriptRef.current = '';

    if (text) handleVoiceSend(text);
    else {
      isUserStoppedVoiceRef.current = false;
      startVoiceListening(true, false);
    }
  };

  const resetVoiceSilenceTimer = () => {
    if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
    voiceSilenceTimerRef.current = setTimeout(() => {
      if (voiceTalkStatusRef.current === 'listening') {
        stopVoiceListeningAndSend();
      }
    }, 4000);
  };

  const startVoiceListening = async (skipMicPermission = false, isAutoRestart = false) => {
    if (!isVoiceModeMountedRef.current || typeof window === 'undefined') return;
    setSpeechError(null);

    if (!isAutoRestart) {
      voiceTranscriptRef.current = '';
      latestCombinedVoiceRef.current = '';
      setVoiceTranscript('');
      isUserStoppedVoiceRef.current = false;
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechError('Voice input is not supported in this browser.');
      return;
    }

    if (!skipMicPermission) {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => stream.getTracks().forEach(t => t.stop()));
        }
      } catch {
        setSpeechError('Microphone permission denied.');
        setVoiceStatus('idle');
        return;
      }
    }

    safeStopRecognition(voiceRecognitionRef);
    voiceGenRef.current += 1;
    const myGen = voiceGenRef.current;

    await new Promise(r => setTimeout(r, RECOGNITION_RESTART_DELAY_MS));
    if (!isVoiceModeMountedRef.current || voiceGenRef.current !== myGen) return;

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = language;
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

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setSpeechError('Microphone permission denied.');
          setVoiceStatus('idle');
        }
      };

      recognition.onend = () => {
        if (voiceGenRef.current !== myGen) return;
        if (sessionFinal) voiceTranscriptRef.current = (voiceTranscriptRef.current + ' ' + sessionFinal).trim();

        if (!isUserStoppedVoiceRef.current && voiceTalkStatusRef.current === 'listening') {
          setTimeout(() => { if (isVoiceModeMountedRef.current && voiceGenRef.current === myGen) startVoiceListening(true, true); }, 50);
        } else if (voiceTalkStatusRef.current === 'listening') {
          setVoiceStatus('idle');
          voiceRecognitionRef.current = null;
        }
      };

      voiceRecognitionRef.current = recognition;
      recognition.start();
      setVoiceStatus('listening');
    } catch {
      setSpeechError('Voice fail.');
    }
  };

  const toggleVoiceMode = () => {
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
      stopAudioPlayback();
      window.speechSynthesis?.cancel();
      setVoiceStatus('idle');
    } else {
      setIsVoiceMode(true);
      isVoiceModeMountedRef.current = true;
      startVoiceListening(false, false);
    }
  };

  // ----- BASIC DICTATION MIC (FOR TEXT CHAT) -----
  const toggleRecording = async (setSpeakText: (t: string) => void) => {
    setSpeechError(null);
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecording) {
      safeStopRecognition(recognitionRef);
      setIsRecording(false);
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => stream.getTracks().forEach(t => t.stop()));
    } catch { return setSpeechError('Mic permission error.'); }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = language;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let fullFinal = '', fullInterim = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) fullFinal += res[0].transcript;
          else fullInterim += res[0].transcript;
        }
        setSpeakText((fullFinal + fullInterim).trim());
      };
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const emergencyStopAudio = () => {
    safeStopRecognition(recognitionRef);
    setIsRecording(false);
    stopAudioPlayback();
    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
  };


  return {
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
    isVoiceModeMountedRef
  };
}
