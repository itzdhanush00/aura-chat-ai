import React from 'react';
import { X, Volume2, Palette, Bell, Zap, Brain, Sparkles } from 'lucide-react';
import { AppSettings, VoiceName, SpeedMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const VOICES: { name: VoiceName; desc: string; sample: string }[] = [
  { name: 'Kore', desc: 'Balanced, expressive, versatile tone', sample: 'Natural female voice' },
  { name: 'Puck', desc: 'Crisp, bright, enthusiastic persona', sample: 'Dynamic male voice' },
  { name: 'Fenrir', desc: 'Authoritative, calm, grounded cadence', sample: 'Deep male tone' },
  { name: 'Zephyr', desc: 'Warm, soothing, conversational pacing', sample: 'Friendly neutral tone' },
  { name: 'Charon', desc: 'Resonant, steady, reflective tone', sample: 'Rich baritone' },
];

const SPEED_MODES: {
  id: SpeedMode;
  name: string;
  badge: string;
  desc: string;
  icon: typeof Zap;
  color: string;
}[] = [
  {
    id: 'ultra-fast',
    name: 'Ultra Fast (Zero Delay)',
    badge: 'Gemini 3.1 Flash Lite',
    desc: 'Instant first-token streaming. Minimal thinking overhead. Ideal for rapid Q&A and instant chats.',
    icon: Zap,
    color: 'text-amber-400',
  },
  {
    id: 'balanced',
    name: 'Balanced (Recommended)',
    badge: 'Gemini 3.8 Flash (Low Latency)',
    desc: 'Rapid streaming with streamlined reasoning. Sharp answers without long thinking pauses.',
    icon: Sparkles,
    color: 'text-indigo-400',
  },
  {
    id: 'deep',
    name: 'Deep Reasoning',
    badge: 'Gemini 3.8 Flash (Extended)',
    desc: 'Maximum chain-of-thought for complex STEM, intricate math, and deep system architecture.',
    icon: Brain,
    color: 'text-purple-400',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-base font-semibold text-white">App Settings & Performance</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-y-auto space-y-5 text-xs pr-1">
          {/* Speed & Model Selection */}
          <div>
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Response Speed & Intelligence</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Choose how quickly responses start streaming. Ultra-fast starts replying in milliseconds.
            </p>
            <div className="mt-2.5 space-y-2">
              {SPEED_MODES.map((mode) => {
                const isSelected = (settings.speedMode || 'balanced') === mode.id;
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onUpdateSettings({ speedMode: mode.id })}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <IconComponent className={`mt-0.5 h-4 w-4 shrink-0 ${mode.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">{mode.name}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {mode.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio voice selector */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <Volume2 className="h-4 w-4 text-indigo-400" />
              <span>Gemini TTS Voice</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Voice model used when reading answers aloud.
            </p>
            <div className="mt-2.5 space-y-1.5">
              {VOICES.map((v) => (
                <button
                  key={v.name}
                  onClick={() => onUpdateSettings({ voice: v.name })}
                  className={`flex w-full items-center justify-between rounded-xl border p-2 text-left transition ${
                    settings.voice === v.name
                      ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-200">{v.name}</span>
                    <span className="ml-2 text-[10px] text-slate-400">{v.desc}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400">{v.sample}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sound feedback toggle */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <Bell className="h-4 w-4 text-indigo-400" />
                  <span>Sound Effects</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Subtle synthesized audio clicks for sending and receiving messages.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ soundEnabled: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-800 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-slate-400 after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
              </label>
            </div>
          </div>

          {/* Theme selector */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <Palette className="h-4 w-4 text-indigo-400" />
              <span>Color Scheme</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ theme: 'midnight' })}
                className={`rounded-xl border p-2.5 text-center transition ${
                  settings.theme === 'midnight'
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                Midnight Dark
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`rounded-xl border p-2.5 text-center transition ${
                  settings.theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                Slate Indigo
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
