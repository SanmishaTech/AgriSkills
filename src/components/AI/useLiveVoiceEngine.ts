'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking';

// ── Configuration ──
const LIVE_MODEL = 'gemini-3.1-flash-live-preview';
const WS_BASE_BETA = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const WS_BASE_ALPHA = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';
const AUDIO_SAMPLE_RATE_OUT = 24000; // Gemini outputs 24kHz PCM
const TARGET_SAMPLE_RATE_IN = 16000; // Gemini expects 16kHz PCM input

const APP_NAME = 'GramKushal';
const SYSTEM_PROMPT = `You are ${APP_NAME} AI — a friendly, knowledgeable voice assistant.
You provide expert advice on modern farming techniques, agriculture, and help users navigate the ${APP_NAME} platform.
Keep your responses conversational and concise (2-4 sentences max) since you are speaking aloud.
Respond in the same language the user speaks in.`;

/**
 * useLiveVoiceEngine — Production-grade Gemini Live API integration.
 *
 * Replaces the old STT → Chat → TTS pipeline with a SINGLE WebSocket
 * connection that handles audio in AND audio out, achieving sub-second
 * latency with natural barge-in support.
 */
export function useLiveVoiceEngine(
  language: string = 'en-US',
  setSpeechError: (err: string | null) => void,
) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceModeStatus, setVoiceModeStatus] = useState<VoiceStatus>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');

  // ── Refs ──
  const wsRef = useRef<WebSocket | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const isConnectedRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const statusRef = useRef<VoiceStatus>('idle');

  // Keep ref in sync
  const setStatus = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setVoiceModeStatus(s);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  //  CONNECTION
  // ═══════════════════════════════════════════════════════════════

  const connect = useCallback(async () => {
    setSpeechError(null);
    setStatus('connecting');
    setVoiceTranscript('');
    setAiTranscript('');

    try {
      // 1) Fetch token from our backend
      const tokenRes = await fetch('/api/live-token', { method: 'POST' });
      const { token, mode } = await tokenRes.json();
      if (!token) throw new Error('No token received');

      // 2) Build WebSocket URL
      const wsUrl = mode === 'ephemeral'
        ? `${WS_BASE_ALPHA}?access_token=${token}`
        : `${WS_BASE_BETA}?key=${token}`;

      // 3) Open WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Live] WebSocket connected');

        // Build language instruction
        let langInstr = '';
        if (language === 'hi-IN') langInstr = '\nCRITICAL: You MUST respond ONLY in Hindi (हिंदी).';
        else if (language === 'mr-IN') langInstr = '\nCRITICAL: You MUST respond ONLY in Marathi (मराठी).';
        else langInstr = '\nCRITICAL: You MUST respond ONLY in English.';

        // Ensure we pass the bare model string as required by the connection string
        // The token constraints use 'gemini-3.1-flash-live-preview', so the setup model must match.
        const modelStr = `models/${LIVE_MODEL}`;

        // Send setup message
        const setupMsg: any = {
          setup: {
            model: modelStr,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT + langInstr }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        };

        ws.send(JSON.stringify(setupMsg));
        console.log('[Live] Setup message sent');
      };

      ws.onmessage = async (event) => {
        try {
          let text = event.data;
          if (text instanceof Blob) {
            text = await text.text();
            console.log('[Live] Blob transformed to text:', text.substring(0, 50) + '...');
          } else {
            console.log('[Live] String text received:', typeof text === 'string' ? text.substring(0, 50) + '...' : typeof text);
          }
          const data = JSON.parse(text);
          console.log('[Live] Parsed data keys:', Object.keys(data));
          handleServerMessage(data);
        } catch (e) {
          console.error('[Live] Failed to parse message. Data was:', event.data, 'Error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[Live] WebSocket error:', err);
        setSpeechError('Connection error. Please try again.');
        disconnect();
      };

      ws.onclose = (ev) => {
        console.log('[Live] WebSocket closed:', ev.code, ev.reason);
        isConnectedRef.current = false;
        if (statusRef.current !== 'idle') {
          setStatus('idle');
        }
      };
    } catch (err: any) {
      console.error('[Live] Connection setup error:', err);
      setSpeechError(err.message || 'Failed to connect to voice service');
      setStatus('idle');
    }
  }, [language, setSpeechError, setStatus]);

  // ═══════════════════════════════════════════════════════════════
  //  SERVER MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════

  const handleServerMessage = useCallback((data: any) => {
    // Setup complete → start microphone
    if (data.setupComplete) {
      console.log('[Live] ✔ Setup complete received! Starting microphone...', data);
      isConnectedRef.current = true;
      startMicrophone();
      return;
    }

    const sc = data.serverContent;
    if (!sc) {
       console.log('[Live] Other message type received:', data);
       return;
    }

    // Interruption: user started speaking while AI was talking
    if (sc.interrupted) {
      console.log('[Live] Interrupted by user');
      stopAllPlayback();
      setStatus('listening');
      setAiTranscript('');
      return;
    }

    // Turn complete: AI finished speaking
    if (sc.turnComplete) {
      console.log('[Live] Turn complete');
      // Don't switch to listening immediately — let audio finish playing
      // The playback end handler will switch to listening
      return;
    }

    // Model audio output
    if (sc.modelTurn?.parts) {
      if (statusRef.current !== 'speaking') {
        setStatus('speaking');
      }
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.data) {
          const pcm = base64ToInt16Array(part.inlineData.data);
          scheduleAudioPlayback(pcm);
        }
      }
    }

    // Input transcription (what user said)
    if (sc.inputTranscription?.text) {
      setVoiceTranscript(prev => {
        const next = prev + sc.inputTranscription.text;
        return next;
      });
    }

    // Output transcription (what AI is saying)
    if (sc.outputTranscription?.text) {
      setAiTranscript(prev => {
        const next = prev + sc.outputTranscription.text;
        return next;
      });
    }
  }, [setStatus]);

  // ═══════════════════════════════════════════════════════════════
  //  MICROPHONE CAPTURE (16kHz PCM)
  // ═══════════════════════════════════════════════════════════════

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // Create AudioContext — browser will use its native sample rate
      const ctx = new AudioContext();
      captureCtxRef.current = ctx;
      const nativeRate = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);

      // ScriptProcessorNode grabs raw Float32 PCM from the mic
      const bufSize = 4096;
      const processor = ctx.createScriptProcessor(bufSize, 1, 1);
      scriptNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isConnectedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const raw = e.inputBuffer.getChannelData(0);

        // Downsample from native rate to 16kHz
        const downsampled = downsample(raw, nativeRate, TARGET_SAMPLE_RATE_IN);

        // Float32 → Int16
        const pcm16 = new Int16Array(downsampled.length);
        for (let i = 0; i < downsampled.length; i++) {
          const s = Math.max(-1, Math.min(1, downsampled[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64 encode and send
        const b64 = int16ArrayToBase64(pcm16);
        try {
          wsRef.current.send(JSON.stringify({
            realtimeInput: {
              audio: {
                data: b64,
                mimeType: 'audio/pcm;rate=16000',
              },
            },
          }));
        } catch { /* WS might be closing */ }
      };

      source.connect(processor);
      // Connect to destination (required for ScriptProcessor to fire)
      // Use a GainNode set to 0 to avoid feedback
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      setStatus('listening');
      setVoiceTranscript('');
      console.log(`[Live] Microphone started (native=${nativeRate}Hz, target=${TARGET_SAMPLE_RATE_IN}Hz)`);
    } catch (err: any) {
      console.error('[Live] Microphone error:', err);
      setSpeechError('Microphone permission denied.');
      disconnect();
    }
  }, [setSpeechError, setStatus]);

  // ═══════════════════════════════════════════════════════════════
  //  AUDIO PLAYBACK (gapless PCM queue)
  // ═══════════════════════════════════════════════════════════════

  const scheduleAudioPlayback = useCallback((pcm: Int16Array) => {
    try {
      if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
        playbackCtxRef.current = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE_OUT });
      }
      const ctx = playbackCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Convert Int16 → Float32
      const float32 = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) {
        float32[i] = pcm[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, AUDIO_SAMPLE_RATE_OUT);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Schedule for gapless playback
      const now = ctx.currentTime;
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now;
      }
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;

      // Track active sources for stop capability
      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        // If all sources finished and we're in speaking mode, go back to listening
        if (activeSourcesRef.current.length === 0 && statusRef.current === 'speaking') {
          setStatus('listening');
          setAiTranscript('');
          setVoiceTranscript('');
        }
      };
    } catch (err) {
      console.error('[Live] Playback scheduling error:', err);
    }
  }, [setStatus]);

  const stopAllPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try { src.stop(); } catch { }
    }
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  //  DISCONNECT / CLEANUP
  // ═══════════════════════════════════════════════════════════════

  const disconnect = useCallback(() => {
    isConnectedRef.current = false;

    // Stop microphone
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current = null;
    }
    if (captureCtxRef.current && captureCtxRef.current.state !== 'closed') {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    // Stop playback
    stopAllPlayback();
    if (playbackCtxRef.current && playbackCtxRef.current.state !== 'closed') {
      playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    setStatus('idle');
    setVoiceTranscript('');
    setAiTranscript('');
  }, [setStatus, stopAllPlayback]);

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  const toggleVoiceMode = useCallback(() => {
    if (isVoiceMode) {
      disconnect();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      connect();
    }
  }, [isVoiceMode, connect, disconnect]);

  const stopSpeakingAndListen = useCallback(() => {
    stopAllPlayback();
    setStatus('listening');
    setAiTranscript('');
  }, [stopAllPlayback, setStatus]);

  const emergencyStopAudio = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (wsRef.current) {
        isConnectedRef.current = false;
        if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
        if (wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      }
    };
  }, []);

  return {
    isVoiceMode,
    toggleVoiceMode,
    voiceModeStatus,
    voiceTranscript,
    aiTranscript,
    stopSpeakingAndListen,
    emergencyStopAudio,
  };
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

/** Downsample Float32Array from one rate to another using linear interpolation */
function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, buffer.length - 1);
    const frac = srcIndex - low;
    result[i] = buffer[low] * (1 - frac) + buffer[high] * frac;
  }
  return result;
}

/** Encode Int16Array to base64 string */
function int16ArrayToBase64(data: Int16Array): string {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

/** Decode base64 string to Int16Array */
function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}
