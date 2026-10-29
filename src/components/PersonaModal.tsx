import React, { useState } from 'react';
import { X, Sparkles, Check, Sliders } from 'lucide-react';
import { Persona } from '../types';
import { DEFAULT_PERSONAS } from '../constants/personas';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: Persona;
  onSelectPersona: (persona: Persona) => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSelectPersona,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activePersona.id);
  const [customInstruction, setCustomInstruction] = useState<string>(
    activePersona.systemInstruction
  );
  const [customTemp, setCustomTemp] = useState<number>(activePersona.temperature);

  if (!isOpen) return null;

  const handleSelectPreset = (p: Persona) => {
    setSelectedId(p.id);
    setCustomInstruction(p.systemInstruction);
    setCustomTemp(p.temperature);
  };

  const handleSave = () => {
    const preset = DEFAULT_PERSONAS.find((p) => p.id === selectedId);
    const updated: Persona = {
      id: selectedId,
      name: preset ? preset.name : 'Custom Persona',
      description: preset ? preset.description : 'Customized AI personality',
      icon: preset ? preset.icon : 'Sparkles',
      systemInstruction: customInstruction,
      temperature: customTemp,
      badgeColor: preset ? preset.badgeColor : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    onSelectPersona(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
      />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                AI Personas & Instructions
              </h2>
              <p className="text-xs text-slate-400">
                Switch specialized behavior or customize system instructions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preset Cards */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DEFAULT_PERSONAS.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`flex items-start justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-white">{p.name}</div>
                  <div className="mt-1 text-[11px] leading-tight text-slate-400">
                    {p.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom system prompt editor */}
        <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>System Prompt / Directive</span>
              <span className="text-[10px] text-slate-500">Guides model persona & tone</span>
            </label>
            <textarea
              rows={3}
              value={customInstruction}
              onChange={(e) => {
                setCustomInstruction(e.target.value);
                if (selectedId !== 'custom') setSelectedId('custom');
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                Temperature (Creativity)
              </span>
              <span className="font-mono text-xs text-indigo-400">
                {customTemp.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={customTemp}
              onChange={(e) => setCustomTemp(parseFloat(e.target.value))}
              className="mt-2 w-full accent-indigo-500 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>0.0 (Strict & Logical)</span>
              <span>0.7 (Balanced)</span>
              <span>1.5 (Imaginative)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
          >
            Apply Persona
          </button>
        </div>
      </div>
    </div>
  );
};
