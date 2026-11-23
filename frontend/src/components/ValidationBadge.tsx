import React, { useState } from 'react';
import { CheckCircle2, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationCheckResult } from '../types/index.js';

interface ValidationBadgeProps {
  check: ValidationCheckResult;
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({ check }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border text-xs transition-all ${
        check.passed
          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}
    >
      <div
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-black/5 rounded-lg select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {check.passed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold truncate">{check.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              check.passed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {check.passed ? 'PASS' : 'FAIL'}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-black/5 text-[11px] leading-relaxed text-slate-700 bg-white/40">
          <p className="flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span>{check.message}</span>
          </p>
        </div>
      )}
    </div>
  );
};
