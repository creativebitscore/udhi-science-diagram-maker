import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { storageService } from '../services/storage.js';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  currentKey,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    storageService.saveApiKey(keyInput.trim());
    onKeySaved(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setKeyInput('');
    storageService.saveApiKey('');
    onKeySaved('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gemini API Key Settings</h3>
              <p className="text-xs text-slate-500">For live on-demand diagram generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl text-xs text-brand-900 space-y-1.5">
            <p className="flex items-start gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>Keys are never exposed publicly or committed to Git.</span>
            </p>
            <p className="text-slate-600 pl-5.5 text-[11px]">
              You can get a 100% free API key from Google AI Studio (no credit card required).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href="https://aistudio.google.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium"
            >
              <span>Get API key at Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {keyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-600 transition text-[11px]"
              >
                Clear Key
              </button>
            )}
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5 font-medium animate-fadeIn">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Key saved successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};
