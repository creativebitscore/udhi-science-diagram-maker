import React, { useState, useEffect, useMemo } from 'react';
import {
  ConceptDefinition,
  DiagramResult,
  ReviewDecision,
  ReviewStatus,
  StatsData,
} from './types/index.js';
import { apiService } from './services/api.js';
import { storageService } from './services/storage.js';
import { Header } from './components/Header.js';
import { StatsOverview } from './components/StatsOverview.js';
import { DiagramTable } from './components/DiagramTable.js';
import { SvgModal } from './components/SvgModal.js';
import { ApiKeyModal } from './components/ApiKeyModal.js';
import { LiveGeneratorModal } from './components/LiveGeneratorModal.js';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [concepts, setConcepts] = useState<ConceptDefinition[]>([]);
  const [diagrams, setDiagrams] = useState<DiagramResult[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewDecision>>({});
  const [apiKey, setApiKey] = useState<string>('');
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedDiagramForModal, setSelectedDiagramForModal] = useState<DiagramResult | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState<boolean>(false);
  const [generatorConceptId, setGeneratorConceptId] = useState<string>('');

  // Initial load
  useEffect(() => {
    // Load local stored reviews and api key
    const savedReviews = storageService.getReviews();
    setReviews(savedReviews);

    const savedKey = storageService.getApiKey();
    setApiKey(savedKey);

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Check health
      try {
        const health = await apiService.getHealth();
        setHasServerApiKey(health.gemini.hasApiKeyConfigured);
      } catch (hErr) {
        console.warn('Backend health check skipped:', hErr);
      }

      // 2. Fetch saved concepts & diagrams (Instant load of the 5 saved results)
      const [fetchedConcepts, fetchedDiagrams] = await Promise.all([
        apiService.getConcepts(),
        apiService.getSavedDiagrams(),
      ]);

      setConcepts(fetchedConcepts);
      setDiagrams(fetchedDiagrams);
      if (fetchedConcepts.length > 0) {
        setGeneratorConceptId((prev) => prev || fetchedConcepts[0].id);
      }

      // Merge backend reviews if frontend has no local decision yet
      const currentReviews = storageService.getReviews();
      const mergedReviews = { ...currentReviews };
      fetchedDiagrams.forEach((d) => {
        if (d.review && !mergedReviews[d.conceptId]) {
          mergedReviews[d.conceptId] = d.review;
        }
      });
      setReviews(mergedReviews);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setError(
        err.message ||
          'Unable to connect to backend service. Please verify that the backend server is running on port 4000.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update Review Handler (Saves to localStorage + syncs with backend)
  const handleUpdateReview = (conceptId: string, status: ReviewStatus, notes: string) => {
    const updatedDecision: ReviewDecision = {
      status,
      notes,
      reviewedAt: new Date().toISOString(),
    };

    // 1. Save in local state
    setReviews((prev) => ({
      ...prev,
      [conceptId]: updatedDecision,
    }));

    // 2. Persist in localStorage
    storageService.saveReview(conceptId, updatedDecision);

    // 3. Sync to backend
    apiService.syncReview(conceptId, status, notes);
  };

  const handleResetReviews = () => {
    if (confirm('Are you sure you want to reset all review statuses and notes?')) {
      storageService.clearAllReviews();
      setReviews({});
    }
  };

  // Live generation trigger
  const handleTriggerGenerate = (conceptId: string) => {
    setGeneratorConceptId(conceptId);
    setIsGeneratorModalOpen(true);
  };

  // Handler when a new diagram is generated
  const handleDiagramGenerated = (newDiagram: DiagramResult) => {
    setDiagrams((prev) => {
      const idx = prev.findIndex((d) => d.conceptId === newDiagram.conceptId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newDiagram;
        return updated;
      }
      return [...prev, newDiagram];
    });
  };

  // Compute stats across current diagrams
  const stats: StatsData = useMemo(() => {
    const totalDiagrams = diagrams.length;
    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    let totalCostUsd = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalApiRetries = 0;
    let totalValidationRetries = 0;
    let passedAllChecksCount = 0;

    diagrams.forEach((d) => {
      const rev = reviews[d.conceptId] || { status: 'pending', notes: '' };
      if (rev.status === 'approved') approvedCount++;
      else if (rev.status === 'rejected') rejectedCount++;
      else pendingCount++;

      totalCostUsd += d.metadata.estimatedCostUsd || 0;
      totalInputTokens += d.metadata.inputTokens || 0;
      totalOutputTokens += d.metadata.outputTokens || 0;
      totalApiRetries += d.metadata.apiRetries || 0;
      totalValidationRetries += d.metadata.validationRetries || 0;

      if (d.validation.isValid) {
        passedAllChecksCount++;
      }
    });

    const passRatePercentage =
      totalDiagrams > 0 ? Math.round((passedAllChecksCount / totalDiagrams) * 100) : 100;

    return {
      totalDiagrams,
      approvedCount,
      rejectedCount,
      pendingCount,
      totalCostUsd,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      passRatePercentage,
      totalApiRetries,
      totalValidationRetries,
    };
  }, [diagrams, reviews]);

  const hasApiKey = Boolean(apiKey || hasServerApiKey);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={hasApiKey}
        onRefreshAll={loadInitialData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-navy-900 to-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-500/30 text-brand-300 border border-brand-400/30">
                Senior Full-Stack Implementation
              </span>
              <span className="text-xs text-slate-300">Udhi Technologies Internship Assignment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              AI Science Diagram Quality &amp; Review Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Programmatic XML validation, viewBox containment checks, SVG animations, token &amp; cost auditing,
              and persistent human review workflow for UK GCSE curriculum diagrams.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setGeneratorConceptId(concepts[0]?.id || 'pythagoras-theorem');
                setIsGeneratorModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Test Live Generator</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && diagrams.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">Loading GCSE Science Diagrams...</p>
            <p className="text-xs text-slate-500 mt-1">Retrieving validated diagrams from results.json</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-900 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold">Failed to load diagrams</h3>
                <p className="text-xs leading-relaxed text-rose-700">{error}</p>
              </div>
            </div>
            <div className="pl-8 flex items-center gap-3">
              <button
                onClick={loadInitialData}
                className="px-3.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!isLoading && diagrams.length > 0 && (
          <>
            {/* Overview Stats Cards */}
            <StatsOverview stats={stats} />

            {/* 5 Diagrams Review Table */}
            <DiagramTable
              diagrams={diagrams}
              reviews={reviews}
              onUpdateReview={handleUpdateReview}
              onOpenSourceModal={(d) => setSelectedDiagramForModal(d)}
              onTriggerGenerate={handleTriggerGenerate}
              onResetReviews={handleResetReviews}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Udhi Science Diagram Maker</span>
            <span>•</span>
            <span>UK GCSE Science Animated Visuals</span>
          </div>
          <div>
            <span>Powered by Gemini API &amp; Custom Programmatic SVG Validator</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SvgModal
        diagram={selectedDiagramForModal}
        onClose={() => setSelectedDiagramForModal(null)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(k) => setApiKey(k)}
        currentKey={apiKey}
      />

      {isGeneratorModalOpen && (
        <LiveGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          concepts={concepts}
          selectedConceptId={generatorConceptId || concepts[0]?.id || 'pythagoras-theorem'}
          onDiagramGenerated={handleDiagramGenerated}
          apiKey={apiKey}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />
      )}
    </div>
  );
};
