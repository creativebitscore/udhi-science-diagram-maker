import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  Maximize2,
  Code2,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { DiagramResult, ReviewDecision, ReviewStatus } from '../types/index.js';
import { ValidationBadge } from './ValidationBadge.js';

interface DiagramCardProps {
  diagram: DiagramResult;
  review: ReviewDecision;
  onUpdateReview: (conceptId: string, status: ReviewStatus, notes: string) => void;
  onOpenSourceModal: (diagram: DiagramResult) => void;
  onTriggerGenerate: (conceptId: string) => void;
}

export const DiagramCard: React.FC<DiagramCardProps> = ({
  diagram,
  review,
  onUpdateReview,
  onOpenSourceModal,
  onTriggerGenerate,
}) => {
  const [noteText, setNoteText] = useState(review.notes || '');

  const handleStatusChange = (status: ReviewStatus) => {
    onUpdateReview(diagram.conceptId, status, noteText);
  };

  const handleNoteBlur = () => {
    if (noteText !== review.notes) {
      onUpdateReview(diagram.conceptId, review.status, noteText);
    }
  };

  const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
    Maths: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    Physics: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    Biology: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Chemistry: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  };

  const subjectStyle = subjectColors[diagram.subject] || subjectColors.Maths;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top Header Row */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${subjectStyle.bg} ${subjectStyle.text} ${subjectStyle.border}`}
          >
            {diagram.subject}
          </span>
          <h3 className="text-base font-bold text-slate-900">{diagram.conceptName}</h3>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSourceModal(diagram)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
            title="Inspect SVG Source Code & Preview"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Inspect SVG</span>
          </button>

          <button
            onClick={() => onTriggerGenerate(diagram.conceptId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs"
            title="Generate a fresh diagram for this concept with Gemini"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Live</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Diagram Preview, Center Checks & Metrics, Right Human Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        {/* Column 1: Animated SVG Preview (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center min-h-[280px]">
            <div
              className="w-full h-full p-2 flex items-center justify-center [&>svg]:max-h-[300px] [&>svg]:w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: diagram.svg }}
            />
            {/* Hover overlay button to expand */}
            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
              <button
                onClick={() => onOpenSourceModal(diagram)}
                className="pointer-events-auto px-3 py-1.5 bg-white/95 text-slate-900 font-semibold text-xs rounded-lg shadow-md hover:bg-white flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5 text-brand-600" />
                Fullscreen View
              </button>
            </div>
          </div>

          {/* Educational Prompt Caption */}
          <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
            "{diagram.prompt}"
          </div>
        </div>

        {/* Column 2: Programmatic Validation Checks & Generation Metrics (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Validation Checks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Validation Engine
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  diagram.validation.isValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {diagram.validation.isValid ? 'ALL 5 PASSED ✓' : 'FAILED'}
              </span>
            </div>

            <div className="space-y-1.5">
              {diagram.validation.checks.map((chk) => (
                <ValidationBadge key={chk.checkId} check={chk} />
              ))}
            </div>
          </div>

          {/* Metadata & Cost Metrics Box */}
          <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                Model:
              </span>
              <span className="font-mono font-semibold text-slate-900">{diagram.metadata.model}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Tokens (In / Out):
              </span>
              <span className="font-mono text-slate-800">
                {diagram.metadata.inputTokens} / {diagram.metadata.outputTokens}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Estimated Cost:
              </span>
              <span className="font-mono font-bold text-emerald-700">
                ${diagram.metadata.estimatedCostUsd.toFixed(6)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1 font-medium">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                Retries (API / Val):
              </span>
              <span className="font-mono text-slate-800">
                <strong className={diagram.metadata.apiRetries > 0 ? 'text-amber-600' : 'text-slate-600'}>
                  {diagram.metadata.apiRetries} API
                </strong>
                {' · '}
                <strong className={diagram.metadata.validationRetries > 0 ? 'text-amber-600' : 'text-slate-600'}>
                  {diagram.metadata.validationRetries} Val
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Human Reviewer Controls (3 cols on lg) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Review Decision
              </span>
              {/* Current status pill */}
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  review.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : review.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {review.status === 'approved' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                {review.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                {review.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                <span className="capitalize">{review.status}</span>
              </span>
            </div>

            {/* Approve and Reject Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleStatusChange('approved')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition shadow-xs ${
                  review.status === 'approved'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-1'
                    : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('rejected')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition shadow-xs ${
                  review.status === 'rejected'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-500 ring-offset-1'
                    : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>

            {/* Reviewer Note Area */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Reviewer Notes (Auto-saved)
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={handleNoteBlur}
                rows={4}
                placeholder="Add pedagogical notes, accuracy assessment, or feedback..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Persists in localStorage</span>
            {review.reviewedAt && (
              <span>Updated: {new Date(review.reviewedAt).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
