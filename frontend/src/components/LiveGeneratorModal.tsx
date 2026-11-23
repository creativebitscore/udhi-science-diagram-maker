import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { ConceptDefinition, DiagramResult } from '../types/index.js';
import { apiService, ApiError } from '../services/api.js';

interface LiveGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: ConceptDefinition[];
  selectedConceptId?: string;
  onDiagramGenerated: (diagram: DiagramResult) => void;
  apiKey: string;
  onOpenApiKeyModal: () => void;
}

export const LiveGeneratorModal: React.FC<LiveGeneratorModalProps> = ({
  isOpen,
  onClose,
  concepts,
  selectedConceptId,
  onDiagramGenerated,
  apiKey,
  onOpenApiKeyModal,
}) => {
  const [conceptId, setConceptId] = useState(selectedConceptId || concepts[0]?.id || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiRetriesLogged, setApiRetriesLogged] = useState<number>(0);

  if (!isOpen) return null;

  const currentConcept = concepts.find((c) => c.id === conceptId) || concepts[0];

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setApiRetriesLogged(0);
    setCurrentStep('Sending prompt to Gemini API...');

    try {
      // Step simulation for visual user reassurance
      setTimeout(() => {
        setCurrentStep('Validating SVG: XML, bounds, labels & animations...');
      }, 1500);

      const result = await apiService.generateDiagram(conceptId, customPrompt, apiKey);
      setCurrentStep('Complete! Rendering validated SVG...');
      onDiagramGenerated(result);
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      setCurrentStep('');
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.apiRetries) {
          setApiRetriesLogged(err.apiRetries);
        }
      } else {
        setError(err.message || 'An error occurred while generating the diagram.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Live AI Diagram Generator</h3>
              <p className="text-xs text-slate-500">Run generation live with Gemini &amp; programmatic validation</p>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Concept Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Concept
            </label>
            <select
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-100"
            >
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.number} {c.name} ({c.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Current Educational Prompt Info */}
          {currentConcept && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Official Assignment Prompt:</span>
              <p className="text-slate-600 italic leading-relaxed">
                "{currentConcept.prompt}"
              </p>
            </div>
          )}

          {/* Optional Prompt Refinement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Prompt Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isLoading}
              rows={2}
              placeholder="e.g. Add glowing electron dots, emphasize hypotenuse square, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-100"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Generation Failed</p>
                  <p className="leading-relaxed">{error}</p>
                </div>
              </div>
              {apiRetriesLogged > 0 && (
                <p className="text-[11px] text-rose-700 pl-6">
                  Recorded <strong>{apiRetriesLogged}</strong> automated API exponential backoff retries before stopping.
                </p>
              )}
              {error.toLowerCase().includes('api key') && (
                <div className="pt-1 pl-6">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenApiKeyModal();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-rose-300 rounded-md text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                  >
                    Configure Gemini API Key <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin shrink-0" />
                <div>
                  <p className="text-xs font-bold text-brand-900">{currentStep}</p>
                  <p className="text-[11px] text-brand-700">Checking XML syntax, viewBox bounds, title, text labels &amp; animations</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            One generation request with 1 validation retry if needed
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Diagram</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
