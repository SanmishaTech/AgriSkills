import { useState, useRef, useEffect } from 'react';

// Defines the shape of a simple message object
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function useChatEngine() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // We use references so our timeouts and listeners can access the freshest data
  // without constantly re-rendering the component.
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  
  // Keep the reference exactly synced with the state
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Low-level HTTP POST request to our local chat API
  const sendSpeakMessage = async (speakText: string, setSpeakText: (t: string) => void, language: string = 'en-US') => {
    const text = speakText.trim();
    if (!text || isAiLoading) return;

    // Abort any previously running request if user spams the send button
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Create a unique ID for the UI to map over
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newUserMsg: ChatMessage = { id, role: 'user', content: text };
    
    // Instantly append the user message to the screen
    setChatMessages((prev) => [...prev, newUserMsg]);
    setSpeakText('');
    setIsAiLoading(true);

    try {
      // Send the last 20 messages as history so the AI remembers context
      const history = [...chatMessagesRef.current, newUserMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      // Send raw bytes to our local server
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, language }),
        signal: controller.signal,
      });

      // Parse the raw JSON string back out
      const data = await res.json();
      const replyId = `${Date.now()}-${Math.random().toString(16).slice(2)}-a`;
      const replyText = res.ok
        ? data.reply
        : data.error || 'Sorry, something went wrong. Please try again.';

      // Append the AI's reply to the screen
      setChatMessages((prev) => [
        ...prev,
        { id: replyId, role: 'assistant', content: replyText },
      ]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setChatMessages((prev) => [
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

  return {
    chatMessages,
    setChatMessages,
    isAiLoading,
    setIsAiLoading,
    speechError,
    setSpeechError,
    chatMessagesRef,
    sendSpeakMessage,
  };
}
