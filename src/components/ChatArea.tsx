import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  ArrowDown,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { Message, Persona, VoiceName } from '../types';
import { MarkdownView } from './MarkdownView';
import { STARTER_PROMPTS } from '../constants/personas';
import { sound } from '../utils/sound';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  activePersona: Persona;
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: (messageIndex: number) => void;
  onEditMessage: (messageIndex: number, newContent: string) => void;
  voice: VoiceName;
  soundEnabled: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  activePersona,
  onSelectPrompt,
  onRegenerate,
  onEditMessage,
  voice,
  soundEnabled,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editDraftText, setEditDraftText] = useState('');

  // Auto scroll to bottom when new messages arrive or while streaming
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, showScrollBottom]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      sound.playClick(soundEnabled);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Text-to-speech handler
  const handleToggleSpeak = async (id: string, text: string) => {
    // If currently playing this audio, stop it
    if (playingAudioId === id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    // Stop any existing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingAudioId(null);
    }

    try {
      setAudioLoadingId(id);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      if (!res.ok) {
        throw new Error('TTS server error');
      }

      const data = await res.json();
      if (!data.audio) throw new Error('No audio returned');

      const audioUrl = `data:audio/wav;base64,${data.audio}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setPlayingAudioId(id);
      setAudioLoadingId(null);

      audio.onended = () => {
        setPlayingAudioId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingAudioId(null);
        setAudioLoadingId(null);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch {
      // Fallback to browser SpeechSynthesis
      setAudioLoadingId(null);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 1000));
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        setPlayingAudioId(id);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleStartEdit = (index: number, content: string) => {
    setEditingMessageIndex(index);
    setEditDraftText(content);
  };

  const handleSaveEdit = (index: number) => {
    if (editDraftText.trim()) {
      onEditMessage(index, editDraftText.trim());
    }
    setEditingMessageIndex(null);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6"
    >
      {/* Empty State / Welcome */}
      {messages.length === 0 ? (
        <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/25">
            <Sparkles className="h-8 w-8 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-indigo-500" />
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            How can I help you today?
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Powered by Google Gemini 3.8 Flash. Chat with specialized personas,
            search the live web, or attach images for instant visual analysis.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-300">
            <span className="text-slate-400">Active Persona:</span>
            <span className="font-semibold text-indigo-400">{activePersona.name}</span>
          </div>

          {/* Prompt starters grid */}
          <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 text-left">
            {STARTER_PROMPTS.map((starter, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectPrompt(starter.text);
                  sound.playClick(soundEnabled);
                }}
                className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-850 hover:shadow-lg hover:shadow-indigo-500/5 text-left"
              >
                <span className="text-xs font-semibold text-indigo-400">
                  {starter.category}
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300 group-hover:text-white">
                  {starter.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Messages Container */
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isEditing = editingMessageIndex === index;

            return (
              <div
                key={message.id || index}
                className={`group flex items-start gap-3.5 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-indigo-600/20'
                      : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-purple-600/20'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Content Bubble / Card */}
                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm transition-all sm:max-w-[78%] ${
                    isUser
                      ? 'rounded-tr-xs bg-indigo-600 text-white shadow-indigo-500/10'
                      : 'rounded-tl-xs border border-slate-800 bg-slate-900/90 text-slate-100 shadow-slate-950/40 backdrop-blur-xs'
                  }`}
                >
                  {/* Attached images preview (if any) */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.attachments.map((att, attIdx) => (
                        <div
                          key={attIdx}
                          className="overflow-hidden rounded-lg border border-white/20 bg-black/20"
                        >
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            className="max-h-48 rounded object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Edit Mode (for user messages) */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editDraftText}
                        onChange={(e) => setEditDraftText(e.target.value)}
                        className="w-full rounded-lg bg-indigo-700 p-2 text-sm text-white outline-none ring-1 ring-white/40"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingMessageIndex(null)}
                          className="rounded px-2.5 py-1 text-white/80 hover:bg-indigo-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="rounded bg-white px-2.5 py-1 font-semibold text-indigo-700 hover:bg-slate-100"
                        >
                          Update & Resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Body */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <div className="text-sm">
                          {message.content ? (
                            <MarkdownView content={message.content} />
                          ) : message.isStreaming ? (
                            <div className="flex items-center gap-2.5 py-1 text-slate-400">
                              <div className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                              </div>
                              <span className="text-xs text-slate-400 font-medium">
                                Generating response...
                              </span>
                            </div>
                          ) : null}

                          {/* Streaming blinking cursor */}
                          {message.isStreaming && message.content && (
                            <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-xs bg-indigo-400 align-middle" />
                          )}

                          {/* Error callout if any */}
                          {message.error && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                              <div>
                                <span className="font-semibold">Error:</span> {message.error}
                              </div>
                            </div>
                          )}

                          {/* Web search grounding sources */}
                          {message.grounding?.groundingChunks &&
                            message.grounding.groundingChunks.length > 0 && (
                              <div className="mt-4 border-t border-slate-800 pt-3">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                  Sources & Citations
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {message.grounding.groundingChunks.map(
                                    (source, sIdx) => (
                                      <a
                                        key={sIdx}
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-xs text-indigo-300 transition hover:border-indigo-500/60 hover:bg-slate-700 hover:text-indigo-200"
                                      >
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        <span className="max-w-[200px] truncate">
                                          {source.title || 'Source'}
                                        </span>
                                      </a>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Actions toolbar below content */}
                  {!isEditing && (
                    <div
                      className={`mt-2 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                        isUser ? 'justify-end text-white/70' : 'justify-start text-slate-400'
                      }`}
                    >
                      {/* Copy */}
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className={`rounded p-1 transition-colors ${
                          isUser ? 'hover:bg-indigo-700 hover:text-white' : 'hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Read aloud (TTS) for AI message */}
                      {!isUser && message.content && (
                        <button
                          onClick={() => handleToggleSpeak(message.id, message.content)}
                          disabled={audioLoadingId === message.id}
                          className={`flex items-center gap-1 rounded p-1 transition-colors hover:bg-slate-800 hover:text-slate-200 ${
                            playingAudioId === message.id ? 'text-indigo-400 font-semibold' : ''
                          }`}
                          title={
                            playingAudioId === message.id
                              ? 'Stop speaking'
                              : 'Read aloud with Gemini TTS'
                          }
                        >
                          {audioLoadingId === message.id ? (
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                          ) : playingAudioId === message.id ? (
                            <>
                              <VolumeX className="h-3.5 w-3.5" />
                              <span className="text-[10px]">Playing...</span>
                            </>
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}

                      {/* Regenerate button (for AI response) */}
                      {!isUser && !isStreaming && (
                        <button
                          onClick={() => onRegenerate(index)}
                          className="rounded p-1 transition-colors hover:bg-slate-800 hover:text-slate-200"
                          title="Regenerate response"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Edit user prompt */}
                      {isUser && !isStreaming && (
                        <button
                          onClick={() => handleStartEdit(index, message.content)}
                          className="rounded p-1 transition-colors hover:bg-indigo-700 hover:text-white"
                          title="Edit message"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 z-30 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white"
        >
          <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
          <span>New messages below</span>
        </button>
      )}
    </div>
  );
};
