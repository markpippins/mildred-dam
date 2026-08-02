import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HardDrive,
  Filter,
  ArrowRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { DuplicatePair } from '../types';
import { formatBytes } from '../services/api';

interface DuplicatesViewProps {
  duplicates: DuplicatePair[];
  onResolveDuplicate: (id: number, resolution: 'duplicate' | 'not_duplicate' | 'manual_override') => Promise<void>;
  isLoading: boolean;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  duplicates,
  onResolveDuplicate,
  isLoading
}) => {
  const [selectedMatcher, setSelectedMatcher] = useState<string>('all');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const totalPotentialRecovery = duplicates
    .filter(d => d.comparison_result === 'duplicate' || d.comparison_result === 'possible_duplicate')
    .reduce((sum, d) => sum + (d.asset_size || 345000000), 0);

  const exactCount = duplicates.filter(d => d.matcher_name === 'exact-content-hash').length;
  const acousticCount = duplicates.filter(d => d.matcher_name === 'acoustic-fingerprint').length;
  const imageCount = duplicates.filter(d => d.matcher_name === 'perceptual-image-hash').length;

  const filtered = selectedMatcher === 'all'
    ? duplicates
    : duplicates.filter(d => d.matcher_name === selectedMatcher);

  const handleResolution = async (
    id: number,
    resolution: 'duplicate' | 'not_duplicate' | 'manual_override'
  ) => {
    setResolvingId(id);
    try {
      await onResolveDuplicate(id, resolution);
    } catch (err) {
      alert('Failed to resolve duplicate match');
    } finally {
      setResolvingId(null);
    }
  };

  const getMatcherBadge = (matcher: string) => {
    switch (matcher) {
      case 'exact-content-hash':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold uppercase">Exact Hash (SHA-256)</span>;
      case 'acoustic-fingerprint':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold uppercase">Acoustic Audio Fingerprint</span>;
      case 'perceptual-image-hash':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase">Perceptual Image Hash (dHash)</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">{matcher}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.99) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (score >= 0.90) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
      {/* Top Intelligence KPI Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potential Space Recovery</span>
            <HardDrive className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{formatBytes(totalPotentialRecovery)}</div>
          <p className="text-xs text-slate-400 mt-1">Identified across {duplicates.length} duplicate pair records</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exact SHA-256 Clones</span>
            <Copy className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{exactCount} Pairs</div>
          <p className="text-xs text-slate-400 mt-1">100% byte-for-byte match • Safe to deduplicate</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuzzy & Acoustic Similarity</span>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{acousticCount + imageCount} Pairs</div>
          <p className="text-xs text-slate-400 mt-1">Audio re-encodes & image crop/rescale matches</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedMatcher('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedMatcher === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Detectors ({duplicates.length})
          </button>
          <button
            onClick={() => setSelectedMatcher('exact-content-hash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedMatcher === 'exact-content-hash'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exact Hashes ({exactCount})
          </button>
          <button
            onClick={() => setSelectedMatcher('acoustic-fingerprint')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedMatcher === 'acoustic-fingerprint'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Acoustic Fingerprints ({acousticCount})
          </button>
          <button
            onClick={() => setSelectedMatcher('perceptual-image-hash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedMatcher === 'perceptual-image-hash'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Image Hashes ({imageCount})
          </button>
        </div>
      </div>

      {/* Duplicate Pairs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading duplicate intelligence analysis...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
            No duplicate pairs match this detector.
          </div>
        ) : (
          filtered.map((pair) => {
            const isWorking = resolvingId === pair.id;

            return (
              <div
                key={pair.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all hover:border-slate-700"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getMatcherBadge(pair.matcher_name)}
                    <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${getScoreColor(pair.score)}`}>
                      Score: {(pair.score * 100).toFixed(0)}% Match
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Evaluated: {new Date(pair.evaluated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Resolution Action Toolbar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 mr-1">Resolve:</span>
                    <button
                      onClick={() => handleResolution(pair.id, 'duplicate')}
                      disabled={isWorking || pair.comparison_result === 'duplicate'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        pair.comparison_result === 'duplicate'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 cursor-default'
                          : 'bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Duplicate</span>
                    </button>

                    <button
                      onClick={() => handleResolution(pair.id, 'not_duplicate')}
                      disabled={isWorking || pair.comparison_result === 'not_duplicate'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        pair.comparison_result === 'not_duplicate'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 cursor-default'
                          : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>False Positive</span>
                    </button>

                    <button
                      onClick={() => handleResolution(pair.id, 'manual_override')}
                      disabled={isWorking || pair.comparison_result === 'manual_override'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        pair.comparison_result === 'manual_override'
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 cursor-default'
                          : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border-slate-700'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Manual Override</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Path Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary / Original Asset */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">
                        <span>Primary Library Asset</span>
                        <span className="text-slate-400 font-mono">#{pair.asset_id}</span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-white break-all">
                        {pair.asset_path}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Size: {formatBytes(pair.asset_size || 345000120)}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded uppercase font-bold text-[10px]">
                        Primary Copy
                      </span>
                    </div>
                  </div>

                  {/* Matched Candidate / Duplicate */}
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-red-400 font-bold uppercase tracking-wider mb-2">
                        <span>Matched Duplicate Candidate</span>
                        <span className="text-slate-400 font-mono">#{pair.matched_asset_id}</span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-white break-all">
                        {pair.matched_path}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-red-500/20 flex items-center justify-between text-xs text-slate-400">
                      <span>Size: {formatBytes(pair.matched_size || 345000120)}</span>
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded uppercase font-bold text-[10px]">
                        Duplicate Candidate
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
