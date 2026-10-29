import React, { useState } from 'react';
import { X, Download, FileText, Code, Check, Copy } from 'lucide-react';
import { ChatSession } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !session) return null;

  const generateMarkdown = () => {
    let md = `# ${session.title}\n`;
    md += `*Exported from Aura Chat AI on ${new Date().toLocaleString()}*\n\n---\n\n`;

    session.messages.forEach((m) => {
      const sender = m.role === 'user' ? '### User' : '### Aura AI';
      const time = new Date(m.timestamp).toLocaleTimeString();
      md += `${sender} *(${time})*\n\n${m.content}\n\n---\n\n`;
    });

    return md;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(session, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}.json`;
    link.click();
  };

  const handleCopyTranscript = async () => {
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Export Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 text-xs">
          <p className="text-slate-400">
            Export “<span className="text-white font-medium">{session.title}</span>” ({session.messages.length} messages) to keep your notes or share with colleagues.
          </p>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-indigo-500/60 hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-indigo-400" />
                <div>
                  <div className="font-semibold text-slate-200">Markdown File (.md)</div>
                  <div className="text-[11px] text-slate-400">
                    Formatted text compatible with Obsidian, Notion, or GitHub
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-indigo-500/60 hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                <Code className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-slate-200">JSON Data (.json)</div>
                  <div className="text-[11px] text-slate-400">
                    Full structured message array, timestamps, and metadata
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={handleCopyTranscript}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-indigo-500/60 hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-indigo-400" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Quick copy as plain formatted markdown text
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
