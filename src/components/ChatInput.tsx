import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Globe,
  Paperclip,
  Mic,
  MicOff,
  X,
  Sparkles,
} from 'lucide-react';
import { ImageAttachment, SpeedMode } from '../types';
import { sound } from '../utils/sound';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: ImageAttachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  soundEnabled: boolean;
  speedMode?: SpeedMode;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  enableSearch,
  onToggleSearch,
  soundEnabled,
  speedMode = 'ultra-fast',
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [text]);

  // Handle Speech-to-text dictation
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    sound.playSend(soundEnabled);
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Process image files
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type,
            data: base64Data,
            previewUrl: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // reset input
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      processFiles(imageFiles);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/80 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto max-w-4xl space-y-2">
        {/* Image Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/90 p-1.5 shadow-sm"
              >
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="h-10 w-10 rounded object-cover"
                />
                <span className="max-w-[120px] truncate text-xs text-slate-300">
                  {att.name}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="rounded-full bg-slate-700/80 p-1 text-slate-300 hover:bg-rose-600 hover:text-white"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="relative flex flex-col rounded-2xl border border-slate-700/80 bg-slate-950/80 shadow-inner transition-all focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask anything, paste code, or drop an image... (Shift+Enter for new line)"
            className="max-h-[220px] min-h-[50px] w-full resize-none bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
          />

          {/* Action toolbar inside bottom of input box */}
          <div className="flex items-center justify-between border-t border-slate-800/60 px-3 py-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              {/* Image attachment button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-slate-800 hover:text-slate-200"
                title="Attach image (multimodal analysis)"
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              {/* Web search toggle button */}
              <button
                type="button"
                onClick={onToggleSearch}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                  enableSearch
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-medium'
                    : 'hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Toggle Google Search Grounding for real-time web info"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Web Search</span>
                {enableSearch && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </button>

              {/* Voice dictation mic button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse font-medium'
                    : 'hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={isRecording ? 'Stop recording dictation' : 'Speech-to-text dictation'}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording && <span className="text-[11px]">Listening...</span>}
              </button>
            </div>

            {/* Right side: token count & Send / Stop Button */}
            <div className="flex items-center gap-2.5">
              {text.length > 0 && (
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  {text.length} chars
                </span>
              )}

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 font-medium text-white shadow-md shadow-rose-600/30 transition hover:bg-rose-500 active:scale-95"
                  title="Stop generating response"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs">Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() && attachments.length === 0}
                  className="flex items-center justify-center rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:shadow-none"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            {speedMode === 'ultra-fast'
              ? 'Gemini 3.1 Flash Lite • Instant streaming'
              : speedMode === 'deep'
              ? 'Gemini 3.8 Flash • Deep chain-of-thought'
              : 'Gemini 3.8 Flash • Low-latency reasoning'}
          </span>
          <span>Aura Chat AI</span>
        </div>
      </div>
    </div>
  );
};
