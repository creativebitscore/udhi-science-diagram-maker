
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
import { LiveGeneratorModal } from './components/LiveGeneratorModal.js';

import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [concepts, setConcepts] = useState<ConceptDefinition[]>([]);
  const [diagrams, setDiagrams] = useState<DiagramResult[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewDecision>>({});

  const [hasServerApiKey, setHasServerApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedDiagramForModal, setSelectedDiagramForModal] =
    useState<DiagramResult | null>(null);

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatorConceptId, setGeneratorConceptId] = useState('');

  // Initial application load
  useEffect(() => {
    setReviews(storageService.getReviews());
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Check backend and Groq configuration.
      try {
        const health = await apiService.getHealth();
        setHasServerApiKey(health.groq.hasApiKeyConfigured);
      } catch (healthError) {
        console.warn('Backend health check skipped:', healthError);
        setHasServerApiKey(false);
      }

      // 2. Load the five saved diagrams without making AI calls.
      const [fetchedConcepts, fetchedDiagrams] = await Promise.all([
        apiService.getConcepts(),
        apiService.getSavedDiagrams(),
      ]);

      setConcepts(fetchedConcepts);
      setDiagrams(fetchedDiagrams);

      if (fetchedConcepts.length > 0) {
        setGeneratorConceptId(
          (previous) => previous || fetchedConcepts[0].id
        );
      }

      // 3. Merge backend reviews with locally saved decisions.
      const localReviews = storageService.getReviews();
      const mergedReviews = { ...localReviews };

      fetchedDiagrams.forEach((diagram) => {
        if (!mergedReviews[diagram.conceptId] && diagram.review) {
          mergedReviews[diagram.conceptId] = diagram.review;
        }
      });

      setReviews(mergedReviews);
    } catch (err: unknown) {
      console.error('Failed to load initial data:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the backend. Verify that the backend server is running on port 4000.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Save a reviewer decision locally and synchronize it with the backend.
  const handleUpdateReview = async (
    conceptId: string,
    status: ReviewStatus,
    notes: string
  ) => {
    const updatedDecision: ReviewDecision = {
      status,
      notes,
      reviewedAt: new Date().toISOString(),
    };

    setReviews((previous) => ({
      ...previous,
      [conceptId]: updatedDecision,
    }));

    // Immediate local persistence.
    storageService.saveReview(conceptId, updatedDecision);

    // Backend persistence.
    try {
      await apiService.syncReview(conceptId, status, notes);
      setError(null);
    } catch (syncError) {
      console.error('Backend review synchronization failed:', syncError);

      setError(
        'Review saved locally, but backend synchronization failed. Please check the backend connection.'
      );
    }
  };

  // Reset reviews locally and on the backend.
  const handleResetReviews = async () => {
    if (
      !confirm(
        'Are you sure you want to reset all review statuses and notes?'
      )
    ) {
      return;
    }

    storageService.clearAllReviews();
    setReviews({});
    setError(null);

    try {
      await Promise.all(
        diagrams.map((diagram) =>
          apiService.syncReview(
            diagram.conceptId,
            'pending',
            ''
          )
        )
      );
    } catch (syncError) {
      console.error('Failed to reset backend reviews:', syncError);

      setError(
        'Reviews were reset locally, but backend synchronization was incomplete.'
      );
    }
  };

  // Open the generator for one selected concept.
  const handleTriggerGenerate = (conceptId: string) => {
    setGeneratorConceptId(conceptId);
    setIsGeneratorModalOpen(true);
  };

  // Update a diagram after successful generation.
  const handleDiagramGenerated = (newDiagram: DiagramResult) => {
    setDiagrams((previous) => {
      const index = previous.findIndex(
        (diagram) => diagram.conceptId === newDiagram.conceptId
      );

      if (index >= 0) {
        const updated = [...previous];
        updated[index] = newDiagram;
        return updated;
      }

      return [...previous, newDiagram];
    });
  };

  // Calculate dashboard statistics.
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

    diagrams.forEach((diagram) => {
      const review = reviews[diagram.conceptId] || {
        status: 'pending',
        notes: '',
      };

      if (review.status === 'approved') {
        approvedCount++;
      } else if (review.status === 'rejected') {
        rejectedCount++;
      } else {
        pendingCount++;
      }

      totalCostUsd += diagram.metadata.estimatedCostUsd || 0;
      totalInputTokens += diagram.metadata.inputTokens || 0;
      totalOutputTokens += diagram.metadata.outputTokens || 0;

      totalApiRetries += diagram.metadata.apiRetries || 0;
      totalValidationRetries += diagram.metadata.validationRetries || 0;

      if (diagram.validation.isValid) {
        passedAllChecksCount++;
      }
    });

    const passRatePercentage =
      totalDiagrams > 0
        ? Math.round(
            (passedAllChecksCount / totalDiagrams) * 100
          )
        : 100;

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Navigation Header */}
      <Header
        hasApiKey={hasServerApiKey}
        onOpenApiKeyModal={() => {}}
        onRefreshAll={loadInitialData}
        isLoading={isLoading}
      />

      {/* Main Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Assignment Banner */}
        <div className="bg-gradient-to-r from-navy-900 to-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-500/30 text-brand-300 border border-brand-400/30">
                Senior Full-Stack Implementation
              </span>

              <span className="text-xs text-slate-300">
                Udhi Technologies Internship Assignment
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              AI Science Diagram Quality &amp; Review Dashboard
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Programmatic XML validation, viewBox containment checks,
              SVG animations, token and cost auditing, and persistent
              human review workflow for UK GCSE curriculum diagrams.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setGeneratorConceptId(
                  concepts[0]?.id || 'pythagoras-theorem'
                );
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

            <p className="text-sm font-bold text-slate-800">
              Loading GCSE Science Diagrams...
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Retrieving saved diagrams from results.json
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-900 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

              <div className="space-y-1">
                <h3 className="text-sm font-bold">
                  Dashboard notification
                </h3>

                <p className="text-xs leading-relaxed text-rose-700">
                  {error}
                </p>
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

        {/* Dashboard Content */}
        {!isLoading && diagrams.length > 0 && (
          <>
            <StatsOverview stats={stats} />

            <DiagramTable
              diagrams={diagrams}
              reviews={reviews}
              onUpdateReview={handleUpdateReview}
              onOpenSourceModal={setSelectedDiagramForModal}
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
            <span className="font-semibold text-slate-800">
              Udhi Science Diagram Maker
            </span>

            <span>•</span>

            <span>UK GCSE Science Animated Visuals</span>
          </div>

          <div>
            Powered by Groq API &amp; Custom Programmatic SVG Validator
          </div>
        </div>
      </footer>

      {/* SVG Source and Preview Modal */}
      <SvgModal
        diagram={selectedDiagramForModal}
        onClose={() => setSelectedDiagramForModal(null)}
      />

      {/* Live Groq Generator */}
      {isGeneratorModalOpen && (
        <LiveGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          concepts={concepts}
          selectedConceptId={
            generatorConceptId ||
            concepts[0]?.id ||
            'pythagoras-theorem'
          }
          onDiagramGenerated={handleDiagramGenerated}
        />
      )}
    </div>
  );
};
