import React, { useState } from 'react';
import { X, Download, FileText, Code, Check, Copy, Archive, Sparkles } from 'lucide-react';
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
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    if (!session) return '';
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
    if (!session) return;
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
    if (!session) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(session, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}.json`;
    link.click();
  };

  const handleCopyTranscript = async () => {
    if (!session) return;
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadProjectZip = () => {
    setIsDownloadingZip(true);
    const link = document.createElement('a');
    link.href = '/api/project/zip';
    link.download = 'aura-chat-ai.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingZip(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Export & Download</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Complete Source Code ZIP download button */}
          <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-indigo-950/30 p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Archive className="h-4 w-4 text-amber-400" />
                  <span>Full Application Source Code (.zip)</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  Download the complete chatbot project (React 19 + TypeScript frontend, Express server, Dockerfile, and README) ready to push to your GitHub repository.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadProjectZip}
              disabled={isDownloadingZip}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>
                {isDownloadingZip
                  ? 'Preparing Download...'
                  : 'Download aura-chat-ai.zip'}
              </span>
            </button>
          </div>

          {/* Conversation exports */}
          {session && session.messages.length > 0 && (
            <div className="border-t border-slate-800 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Conversation ({session.messages.length} messages)
              </span>

              <div className="mt-2.5 space-y-2">
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left transition hover:border-indigo-500/60 hover:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-slate-200">
                        Markdown Transcript (.md)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Formatted for Notion, Obsidian, or GitHub Readme
                      </div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left transition hover:border-indigo-500/60 hover:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <Code className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-slate-200">
                        JSON Message Archive (.json)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Full structured message objects and metadata
                      </div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  onClick={handleCopyTranscript}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left transition hover:border-indigo-500/60 hover:bg-slate-800/60"
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
                      <div className="text-[10px] text-slate-400">
                        Instant copy of plain formatted transcript
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-800 pt-3">
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
