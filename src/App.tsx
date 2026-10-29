import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Bot,
  Plus,
  Globe,
  SlidersHorizontal,
  Download,
  Zap,
  Brain,
} from 'lucide-react';
import {
  ChatSession,
  Message,
  ImageAttachment,
  Persona,
  AppSettings,
  GroundingMetadata,
} from './types';
import { DEFAULT_PERSONAS } from './constants/personas';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { PersonaModal } from './components/PersonaModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { sound } from './utils/sound';

const STORAGE_KEY_SESSIONS = 'aura_chat_sessions_v1';
const STORAGE_KEY_PERSONA = 'aura_chat_persona_v1';
const STORAGE_KEY_SETTINGS = 'aura_chat_settings_v1';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [activePersona, setActivePersona] = useState<Persona>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERSONA);
      return saved ? JSON.parse(saved) : DEFAULT_PERSONAS[0];
    } catch {
      return DEFAULT_PERSONAS[0];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          soundEnabled: parsed.soundEnabled ?? true,
          voice: parsed.voice || 'Kore',
          theme: parsed.theme || 'midnight',
          autoSpeak: parsed.autoSpeak || false,
          speedMode: parsed.speedMode || 'ultra-fast',
        };
      }
    } catch {
      // ignore
    }
    return {
      soundEnabled: true,
      voice: 'Kore',
      theme: 'midnight',
      autoSpeak: false,
      speedMode: 'ultra-fast',
    };
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (err) {
      console.warn('Failed to save sessions to localStorage', err);
    }
  }, [sessions]);

  // Sync persona to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PERSONA, JSON.stringify(activePersona));
    } catch (err) {
      console.warn('Failed to save persona to localStorage', err);
    }
  }, [activePersona]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save settings to localStorage', err);
    }
  }, [settings]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || null;

  // Create new session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personaId: activePersona.id,
      enableSearch: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleClearAll = () => {
    setSessions([]);
    setActiveSessionId(null);
  };

  const handleToggleSearch = () => {
    if (!activeSessionId) {
      handleNewChat();
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, enableSearch: !s.enableSearch } : s
      )
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // mark streaming message as complete
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const updatedMessages = s.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...s, messages: updatedMessages };
        })
      );
    }
  };

  // Main message sender logic
  const handleSendMessage = async (
    text: string,
    attachments: ImageAttachment[] = []
  ) => {
    let currentSessionId = activeSessionId;
    let targetSession = sessions.find((s) => s.id === currentSessionId);

    // If no active session, create one
    if (!targetSession) {
      const newSession: ChatSession = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: text.slice(0, 32) || 'New Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personaId: activePersona.id,
        enableSearch: false,
      };
      currentSessionId = newSession.id;
      targetSession = newSession;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: Date.now(),
    };

    const modelMessageId = `msg_${Date.now() + 1}_m`;
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const updatedMessages = [...targetSession.messages, userMessage, modelMessage];

    // Auto title generation if it's the first message
    const updatedTitle =
      targetSession.messages.length === 0 && text
        ? text.slice(0, 36) + (text.length > 36 ? '...' : '')
        : targetSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              title: updatedTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Build contents payload for Gemini SDK
    // Each item in history converted to { role: 'user'|'model', parts: [...] }
    const contentsPayload = [
      ...targetSession.messages,
      userMessage,
    ].map((m) => {
        const parts: any[] = [];
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach((att) => {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data,
              },
            });
          });
        }
        if (m.content) {
          parts.push({ text: m.content });
        }
        return {
          role: m.role,
          parts,
        };
      });

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contentsPayload,
          systemInstruction: activePersona.systemInstruction,
          enableSearch: targetSession.enableSearch,
          temperature: activePersona.temperature,
          speedMode: settings.speedMode || 'ultra-fast',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream not readable');

      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let accumulatedGrounding: GroundingMetadata | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
              }
              if (parsed.grounding) {
                accumulatedGrounding = parsed.grounding;
              }

              // Update message in real time
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== currentSessionId) return s;
                  const newMsgs = s.messages.map((m) =>
                    m.id === modelMessageId
                      ? {
                          ...m,
                          content: accumulatedText,
                          grounding: accumulatedGrounding,
                        }
                      : m
                  );
                  return { ...s, messages: newMsgs };
                })
              );
            } catch {
              // ignore JSON parse chunk errors
            }
          }
        }
      }

      // If stream ended without text, attempt fallback to non-streaming /api/chat
      if (!accumulatedText.trim()) {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contentsPayload,
            systemInstruction: activePersona.systemInstruction,
            enableSearch: targetSession.enableSearch,
            temperature: activePersona.temperature,
            speedMode: settings.speedMode || 'ultra-fast',
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          accumulatedText = fallbackData.text || '';
          accumulatedGrounding = fallbackData.grounding;
        }
      }

      // Finish cleanly
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const finalMsgs = s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  content: accumulatedText,
                  grounding: accumulatedGrounding,
                  isStreaming: false,
                }
              : m
          );
          return { ...s, messages: finalMsgs };
        })
      );

      sound.playReceive(settings.soundEnabled);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        // Try fallback to non-streaming /api/chat
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contentsPayload,
              systemInstruction: activePersona.systemInstruction,
              enableSearch: targetSession.enableSearch,
              temperature: activePersona.temperature,
              speedMode: settings.speedMode || 'ultra-fast',
            }),
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const finalMsgs = s.messages.map((m) =>
                  m.id === modelMessageId
                    ? {
                        ...m,
                        content: fallbackData.text || '',
                        grounding: fallbackData.grounding,
                        isStreaming: false,
                      }
                    : m
                );
                return { ...s, messages: finalMsgs };
              })
            );
            sound.playReceive(settings.soundEnabled);
            return;
          }
        } catch {
          // ignore fallback error
        }

        console.error('Chat error:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            const errorMsgs = s.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    error: err.message || 'Failed to complete response generation.',
                  }
                : m
            );
            return { ...s, messages: errorMsgs };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = (messageIndex: number) => {
    if (!activeSession) return;
    // Find the user message preceding this model message
    const previousUserMsg = activeSession.messages[messageIndex - 1];
    if (previousUserMsg && previousUserMsg.role === 'user') {
      // Remove all messages from messageIndex onwards
      const sliced = activeSession.messages.slice(0, messageIndex);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id ? { ...s, messages: sliced } : s
        )
      );
      handleSendMessage(previousUserMsg.content, previousUserMsg.attachments || []);
    }
  };

  const handleEditMessage = (messageIndex: number, newContent: string) => {
    if (!activeSession) return;
    // Keep messages up to messageIndex
    const sliced = activeSession.messages.slice(0, messageIndex);
    const targetMsg = activeSession.messages[messageIndex];
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, messages: sliced } : s
      )
    );
    handleSendMessage(newContent, targetMsg.attachments || []);
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        settings.theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAll={handleClearAll}
        activePersona={activePersona}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        soundEnabled={settings.soundEnabled}
      />

      {/* Main chat viewport */}
      <main className="flex flex-1 flex-col overflow-hidden bg-radial from-slate-900/60 via-slate-950 to-slate-950">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
              title="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {activeSession ? activeSession.title : 'Aura Chat AI'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Mode toggle button */}
            <button
              onClick={() => {
                const nextMode =
                  settings.speedMode === 'ultra-fast'
                    ? 'balanced'
                    : settings.speedMode === 'balanced'
                    ? 'deep'
                    : 'ultra-fast';
                setSettings((prev) => ({ ...prev, speedMode: nextMode }));
                sound.playClick(settings.soundEnabled);
              }}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                settings.speedMode === 'ultra-fast'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : settings.speedMode === 'deep'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              } hover:brightness-110`}
              title="Click to toggle response speed mode (Ultra Fast / Balanced / Deep Reasoning)"
            >
              {settings.speedMode === 'ultra-fast' ? (
                <>
                  <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="hidden sm:inline">Ultra Fast</span>
                </>
              ) : settings.speedMode === 'deep' ? (
                <>
                  <Brain className="h-3 w-3 text-purple-400" />
                  <span className="hidden sm:inline">Deep</span>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 text-indigo-400" />
                  <span className="hidden sm:inline">Balanced</span>
                </>
              )}
            </button>

            {/* Active persona button */}
            <button
              onClick={() => setIsPersonaModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${activePersona.badgeColor} hover:brightness-110`}
              title="Change active persona"
            >
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">{activePersona.name}</span>
            </button>

            {/* Google Search status indicator if active */}
            {activeSession?.enableSearch && (
              <span className="hidden sm:flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
                <Globe className="h-3 w-3" />
                <span>Web Grounding</span>
              </span>
            )}

            {/* Quick new chat button */}
            <button
              onClick={() => {
                handleNewChat();
                sound.playClick(settings.soundEnabled);
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              title="New Conversation"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Conversation Message Feed */}
        <ChatArea
          messages={activeSession ? activeSession.messages : []}
          isStreaming={isStreaming}
          activePersona={activePersona}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
          voice={settings.voice}
          soundEnabled={settings.soundEnabled}
        />

        {/* Input box toolbar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          enableSearch={activeSession ? activeSession.enableSearch : false}
          onToggleSearch={handleToggleSearch}
          soundEnabled={settings.soundEnabled}
          speedMode={settings.speedMode}
        />
      </main>

      {/* Modals */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        activePersona={activePersona}
        onSelectPersona={(p) => setActivePersona(p)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        session={activeSession}
      />
    </div>
  );
}
