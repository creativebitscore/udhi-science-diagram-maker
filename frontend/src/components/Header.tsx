
import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  onRefreshAll: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand and Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
            U
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Udhi Science Diagram Maker
              </h1>

              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                UK GCSE Edition
              </span>
            </div>

            <p className="text-xs text-slate-500">
              AI-generated educational SVGs with programmatic validation &amp; human review
            </p>
          </div>
        </div>

        {/* Groq API Status */}
        <div className="flex items-center gap-2.5">
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              hasApiKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            {hasApiKey ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}

            <span>
              {hasApiKey ? 'Groq API: Ready' : 'Groq API: Not configured'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>GPT-OSS 20B</span>
          </div>
        </div>

      </div>
    </header>
  );
};
