import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Settings,
  Download,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { ChatSession, Persona } from '../types';
import { sound } from '../utils/sound';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  activePersona: Persona;
  onOpenPersonaModal: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  soundEnabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  activePersona,
  onOpenPersonaModal,
  onOpenSettings,
  onOpenExport,
  isOpen,
  onCloseMobile,
  soundEnabled,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteSession(id);
    sound.playClick(soundEnabled);
  };

  // Group sessions by date
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const groups: { [key: string]: ChatSession[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  filteredSessions.forEach((s) => {
    const diff = now - s.updatedAt;
    if (diff < ONE_DAY) {
      groups.Today.push(s);
    } else if (diff < 2 * ONE_DAY) {
      groups.Yesterday.push(s);
    } else if (diff < 7 * ONE_DAY) {
      groups['Previous 7 Days'].push(s);
    } else {
      groups.Older.push(s);
    }
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-md transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight">Aura Chat</span>
              <span className="ml-1.5 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/30">
                Gemini 3.8
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action button: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              sound.playClick(soundEnabled);
              onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          {/* Active persona chip button */}
          <div className="mt-2.5">
            <button
              onClick={onOpenPersonaModal}
              className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/80"
              title="Change AI Persona & Instructions"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate font-medium">{activePersona.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-400">
                Switch
              </span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        {sessions.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 text-xs">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <MessageSquare className="mb-2 h-8 w-8 stroke-1 text-slate-600" />
              <p className="font-medium text-slate-400">No chats yet</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Start a conversation to see your history here.
              </p>
            </div>
          ) : (
            Object.entries(groups).map(([groupTitle, groupSessions]) => {
              if (groupSessions.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {groupTitle}
                  </div>
                  {groupSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isEditing = editingId === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          onSelectSession(session.id);
                          sound.playClick(soundEnabled);
                          onCloseMobile();
                        }}
                        className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 transition-all ${
                          isActive
                            ? 'bg-slate-800 text-white font-medium shadow-xs border border-slate-700/60'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2 flex-1">
                          <MessageSquare
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isActive ? 'text-indigo-400' : 'text-slate-500'
                            }`}
                          />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTitle}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e as any, session.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="w-full rounded bg-slate-950 px-1.5 py-0.5 text-xs text-white outline-none border border-indigo-500"
                            />
                          ) : (
                            <span className="truncate">{session.title}</span>
                          )}
                        </div>

                        {/* Session action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => handleSaveRename(e, session.id)}
                                className="rounded p-1 text-emerald-400 hover:bg-slate-700"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="rounded p-1 text-slate-400 hover:bg-slate-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => handleStartRename(e, session)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                                title="Rename chat"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, session.id)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-950/60 hover:text-rose-400"
                                title="Delete chat"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom utility controls */}
        <div className="border-t border-slate-800 p-3 space-y-1.5 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-800 hover:text-slate-200 text-slate-300"
              title="Export conversations or download project ZIP"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Export / ZIP</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-800 hover:text-slate-200"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {sessions.length > 0 && (
            <div className="pt-1">
              {confirmClear ? (
                <div className="flex items-center justify-between rounded-lg bg-rose-950/40 border border-rose-900/50 p-2 text-[11px] text-rose-300">
                  <span>Clear all chats?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="rounded bg-rose-600 px-2 py-0.5 font-semibold text-white hover:bg-rose-500"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex w-full items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors py-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear conversation history</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
