
import React from 'react';
import { X, ShieldCheck, Server, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
              <Server className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Groq API Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Backend-managed AI integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close configuration dialog"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
            <p className="flex items-start gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              Groq integration is configured on the backend.
            </p>

            <p className="text-emerald-800 pl-5">
              API credentials are kept on the server and are never requested
              or stored in the browser.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500">AI Provider</p>
              <p className="text-sm font-bold text-slate-900">Groq</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Configured Model</p>
              <p className="text-sm font-bold text-slate-900">
                openai/gpt-oss-20b
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">API Endpoint</p>
              <p className="text-xs font-mono text-slate-700 break-all">
                api.groq.com/openai/v1/chat/completions
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-800">
              Need to configure or change the API key?
            </p>

            <p className="text-xs text-slate-600 leading-relaxed">
              Open the backend environment file:
            </p>

            <code className="block bg-slate-900 text-emerald-300 rounded-lg p-2 text-[11px] break-all">
              backend/.env
            </code>

            <p className="text-xs text-slate-600">
              Set GROQ_API_KEY and GROQ_MODEL there, then restart the backend.
            </p>
          </div>

          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:text-brand-800 flex items-center gap-1.5 text-xs font-semibold"
          >
            Manage Groq API keys
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
