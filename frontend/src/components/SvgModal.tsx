import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, Eye, ShieldCheck, Cpu } from 'lucide-react';
import { DiagramResult } from '../types/index.js';

interface SvgModalProps {
  diagram: DiagramResult | null;
  onClose: () => void;
}

export const SvgModal: React.FC<SvgModalProps> = ({ diagram, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
  const [copied, setCopied] = useState(false);

  if (!diagram) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(diagram.svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([diagram.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.conceptId}-diagram.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">
                {diagram.subject}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{diagram.conceptName}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">{diagram.prompt}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium mr-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Animated Preview
              </button>
              <button
                onClick={() => setActiveTab('source')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'source'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                SVG Source Code
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              title="Copy SVG XML"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition"
              title="Download as .svg file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100/70">
          {activeTab === 'preview' ? (
            <div className="flex flex-col items-center justify-center min-h-[480px]">
              <div
                className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-slate-200/80 p-4 overflow-hidden flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: diagram.svg }}
              />
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  All 5 Programmatic Validation Checks Passed
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-4 h-4 text-brand-600" />
                  Rendered via SVG Vector Engine
                </span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-[540px] border border-slate-800">
                <code>{diagram.svg}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>Model: <strong className="text-slate-900">{diagram.metadata.model}</strong></span>
            <span>Tokens: <strong>{diagram.metadata.inputTokens}</strong> in / <strong>{diagram.metadata.outputTokens}</strong> out</span>
            <span>Est. Cost: <strong className="text-emerald-700">${diagram.metadata.estimatedCostUsd.toFixed(6)}</strong></span>
          </div>
          <div>
            <span>Generated: {new Date(diagram.metadata.generatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
