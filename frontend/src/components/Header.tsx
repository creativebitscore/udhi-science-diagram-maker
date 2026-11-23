import React from 'react';
import { Sparkles, Key, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  onRefreshAll: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKeyModal,
  hasApiKey,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
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

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              hasApiKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Gemini API: Ready' : 'Add Gemini API Key'}</span>
          </button>

          {/* Quick link to assignment guidelines or aistudio */}
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Get Free Key</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
          </a>
        </div>
      </div>
    </header>
  );
};
