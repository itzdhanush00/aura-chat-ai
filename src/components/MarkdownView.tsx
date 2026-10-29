import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  // Extract and replace code blocks with interactive React code blocks
  // Regex to match ```language \n code \n ```
  const parts: Array<{ type: 'markdown' | 'code'; lang?: string; code?: string; text?: string }> = [];
  
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        text: content.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      lang: match[1] || 'code',
      code: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      text: content.substring(lastIndex),
    });
  }

  return (
    <div className="prose prose-invert max-w-none space-y-3 leading-relaxed text-slate-200">
      {parts.map((part, index) => {
        if (part.type === 'code' && part.code !== undefined) {
          return (
            <CodeBlock
              key={`code-${index}`}
              language={part.lang || 'code'}
              code={part.code}
            />
          );
        }

        // Render standard markdown HTML safely
        const rawHtml = marked.parse(part.text || '', {
          breaks: true,
          gfm: true,
        }) as string;

        return (
          <div
            key={`md-${index}`}
            className="markdown-body space-y-2.5 break-words [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-white [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500/60 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_blockquote]:bg-slate-800/40 [&_blockquote]:py-1 [&_blockquote]:rounded-r [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-slate-700 [&_th]:bg-slate-800/80 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-slate-700/60 [&_td]:p-2 [&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-indigo-300 [&_code]:bg-slate-800 [&_code]:text-indigo-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.875em] [&_code]:font-mono"
            dangerouslySetInnerHTML={{ __html: rawHtml }}
          />
        );
      })}
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 font-mono text-sm shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-slate-300">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200">
        <pre className="!bg-transparent !p-0 !m-0 font-mono whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
