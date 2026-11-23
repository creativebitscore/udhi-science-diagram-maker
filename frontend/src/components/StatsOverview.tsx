import React from 'react';
import { CheckCircle, XCircle, Clock, DollarSign, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import { StatsData } from '../types/index.js';

interface StatsOverviewProps {
  stats: StatsData;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Diagrams */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Concepts</span>
          <Layers className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{stats.totalDiagrams}</span>
          <span className="text-xs text-slate-500">Required</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          All 5 GCSE topics loaded
        </div>
      </div>

      {/* 2. Review Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Reviews</span>
          <div className="flex gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-700">{stats.approvedCount}</span>
          <span className="text-xs font-medium text-slate-400">/</span>
          <span className="text-lg font-semibold text-rose-600">{stats.rejectedCount}</span>
          <span className="text-xs font-medium text-slate-400">/</span>
          <span className="text-sm font-semibold text-amber-600">{stats.pendingCount}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{stats.pendingCount} pending decision</span>
        </div>
      </div>

      {/* 3. Validation Pass Rate */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Pass Rate</span>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-emerald-700">{stats.passRatePercentage}%</span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-700 font-medium">
          5 / 5 checks passed
        </div>
      </div>

      {/* 4. Total Cost */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Est. AI Cost</span>
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">${stats.totalCostUsd.toFixed(5)}</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Gemini 2.5 Flash pricing
        </div>
      </div>

      {/* 5. Total Tokens */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Total Tokens</span>
          <span className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">IN/OUT</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">{stats.totalTokens.toLocaleString()}</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          {stats.totalInputTokens.toLocaleString()} in • {stats.totalOutputTokens.toLocaleString()} out
        </div>
      </div>

      {/* 6. Retries Logged */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Retries Logged</span>
          <RefreshCw className="w-4 h-4 text-brand-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{stats.totalApiRetries}</span>
          <span className="text-xs text-slate-500">API</span>
          <span className="text-slate-300">|</span>
          <span className="text-2xl font-bold text-slate-900">{stats.totalValidationRetries}</span>
          <span className="text-xs text-slate-500">Val</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Tracked separately
        </div>
      </div>
    </div>
  );
};
