import React, { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { DiagramResult, ReviewDecision, ReviewStatus } from '../types/index.js';
import { DiagramCard } from './DiagramCard.js';

interface DiagramTableProps {
  diagrams: DiagramResult[];
  reviews: Record<string, ReviewDecision>;
  onUpdateReview: (conceptId: string, status: ReviewStatus, notes: string) => void;
  onOpenSourceModal: (diagram: DiagramResult) => void;
  onTriggerGenerate: (conceptId: string) => void;
  onResetReviews: () => void;
}

export const DiagramTable: React.FC<DiagramTableProps> = ({
  diagrams,
  reviews,
  onUpdateReview,
  onOpenSourceModal,
  onTriggerGenerate,
  onResetReviews,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const filteredDiagrams = diagrams.filter((d) => {
    const rev = reviews[d.conceptId] || { status: 'pending', notes: '' };
    const matchesStatus = filterStatus === 'all' || rev.status === filterStatus;
    const matchesSubject = filterSubject === 'all' || d.subject === filterSubject;
    return matchesStatus && matchesSubject;
  });

  const subjects = ['all', 'Maths', 'Physics', 'Biology', 'Chemistry'];

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters & Reset */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {(['all', 'approved', 'rejected', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setFilterSubject(sub)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  filterSubject === sub
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredDiagrams.length}</strong> of {diagrams.length} diagrams
          </span>

          <button
            onClick={onResetReviews}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Reset reviewer decisions and notes"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Reviews</span>
          </button>
        </div>
      </div>

      {/* 5 Diagram Rows */}
      <div className="space-y-5">
        {filteredDiagrams.map((diagram) => {
          const review = reviews[diagram.conceptId] || { status: 'pending', notes: '' };
          return (
            <DiagramCard
              key={diagram.conceptId}
              diagram={diagram}
              review={review}
              onUpdateReview={onUpdateReview}
              onOpenSourceModal={onOpenSourceModal}
              onTriggerGenerate={onTriggerGenerate}
            />
          );
        })}

        {filteredDiagrams.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">No diagrams match the selected filter.</p>
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterSubject('all');
              }}
              className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
