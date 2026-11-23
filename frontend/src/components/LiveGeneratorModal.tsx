
import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import {
  ConceptDefinition,
  DiagramResult,
} from '../types/index.js';

import {
  apiService,
  ApiError,
} from '../services/api.js';

interface LiveGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: ConceptDefinition[];
  selectedConceptId?: string;
  onDiagramGenerated: (diagram: DiagramResult) => void;

  // Retained temporarily for compatibility with App.tsx.
  // These values are never sent to the backend.
  apiKey?: string;
  onOpenApiKeyModal?: () => void;
}

export const LiveGeneratorModal: React.FC<LiveGeneratorModalProps> = ({
  isOpen,
  onClose,
  concepts,
  selectedConceptId,
  onDiagramGenerated,
}) => {
  const [conceptId, setConceptId] = useState<string>(
    selectedConceptId ||
      (concepts.length > 0 ? concepts[0].id : '')
  );

  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiRetriesLogged, setApiRetriesLogged] = useState(0);

  // Synchronize selected concept when the modal opens.
  useEffect(() => {
    if (!isOpen) return;

    if (
      selectedConceptId &&
      concepts.some((concept) => concept.id === selectedConceptId)
    ) {
      setConceptId(selectedConceptId);
    } else if (
      concepts.length > 0 &&
      (!conceptId ||
        !concepts.some((concept) => concept.id === conceptId))
    ) {
      setConceptId(concepts[0].id);
    }

    setError(null);
  }, [isOpen, selectedConceptId, concepts]);

  if (!isOpen) return null;

  // Resolve selected concept safely.
  const effectiveConceptId =
    conceptId && concepts.some((concept) => concept.id === conceptId)
      ? conceptId
      : selectedConceptId &&
          concepts.some(
            (concept) => concept.id === selectedConceptId
          )
        ? selectedConceptId
        : concepts[0]?.id || '';

  const currentConcept = concepts.find(
    (concept) => concept.id === effectiveConceptId
  ) || concepts[0];

  const handleGenerate = async () => {
    const targetConceptId = effectiveConceptId;

    if (!targetConceptId) {
      setError(
        'Please select a valid science concept before generating.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiRetriesLogged(0);
    setCurrentStep('Connecting to Groq API...');

    // Update progress if generation takes longer.
    const progressTimer = setTimeout(() => {
      setCurrentStep(
        'Validating SVG: XML, bounds, labels, animation and security...'
      );
    }, 1500);

    try {
      // The API key is managed securely by the backend.
      const result = await apiService.generateDiagram(
        targetConceptId,
        customPrompt
      );

      clearTimeout(progressTimer);

      setCurrentStep('Complete! Rendering generated SVG...');

      onDiagramGenerated(result);

      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep('');
        onClose();
      }, 400);
    } catch (err: unknown) {
      clearTimeout(progressTimer);

      setIsLoading(false);
      setCurrentStep('');

      if (err instanceof ApiError) {
        setError(err.message);

        if (err.apiRetries) {
          setApiRetriesLogged(err.apiRetries);
        }
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred during generation.';

        if (
          message.toLowerCase().includes('groq_api_key') ||
          message.toLowerCase().includes('api key is not configured')
        ) {
          setError(
            'Groq API key is not configured on the backend. Check GROQ_API_KEY in backend/.env and restart the backend server.'
          );
        } else {
          setError(message);
        }
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
              <h3 className="text-base font-bold text-slate-900">
                Live AI Diagram Generator
              </h3>

              <p className="text-xs text-slate-500">
                Powered by Groq GPT-OSS 20B and programmatic SVG validation
              </p>
            </div>
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              aria-label="Close generator"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">

          {/* Groq provider information */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-900">
                Groq AI Provider
              </span>
            </div>

            <span className="text-[11px] font-medium text-emerald-800">
              GPT-OSS 20B
            </span>
          </div>

          {/* Concept Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Concept
            </label>

            <select
              value={effectiveConceptId}
              onChange={(event) => setConceptId(event.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-100"
            >
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  #{concept.number} {concept.name} ({concept.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Official Assignment Prompt */}
          {currentConcept && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Official Assignment Prompt:
              </span>

              <p className="text-slate-600 italic leading-relaxed">
                "{currentConcept.prompt}"
              </p>
            </div>
          )}

          {/* Custom Prompt */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Prompt Instructions (Optional)
            </label>

            <textarea
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
              disabled={isLoading}
              rows={3}
              placeholder="e.g. Improve diagram clarity, add animated electron movement, or adjust scientific labels..."
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
                  Recorded <strong>{apiRetriesLogged}</strong> automated
                  API retries using exponential backoff.
                </p>
              )}
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin shrink-0" />

                <div>
                  <p className="text-xs font-bold text-brand-900">
                    {currentStep}
                  </p>

                  <p className="text-[11px] text-brand-700">
                    Checking XML syntax, viewBox bounds, title, labels,
                    animations and security.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            One generation with up to one validation retry
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
              disabled={isLoading || !effectiveConceptId}
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
