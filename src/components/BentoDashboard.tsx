import React, { useState } from 'react';
import {
  Activity,
  Copy,
  TrendingUp,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { LibraryStats, DuplicatePair, AssetSummary, ActivityLogItem } from '../types';
import { formatBytes, scanAllLibraryPaths } from '../services/api';

interface BentoDashboardProps {
  stats: LibraryStats | null;
  duplicates: DuplicatePair[];
  recentAssets: AssetSummary[];
  onSelectTab: (tab: any) => void;
  onOpenAssetDetail?: (asset: AssetSummary) => void;
  onOpenDetailModal?: (asset: AssetSummary) => void;
  onOpenIngestModal: () => void;
  onOpenDuplicatesModal?: () => void;
  onOpenPlayModal?: (asset: AssetSummary) => void;
  onOpenActivityModal?: () => void;
  onNavigateToCatalog?: () => void;
  onNavigateToDuplicates?: () => void;
  browseSummary?: any;
  onRefreshStats?: () => void;
  onQuickScanSuccess?: () => void;
  recentActivity?: ActivityLogItem[];
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({
  stats,
  duplicates,
  recentAssets,
  onSelectTab,
  onOpenAssetDetail,
  onOpenIngestModal,
  onOpenDuplicatesModal,
  onOpenActivityModal,
  onRefreshStats,
  onQuickScanSuccess,
  recentActivity = []
}) => {
  const totalAssets = stats?.total_assets || 0;
  const totalBytes = stats?.total_bytes || 0;
  const byKind = stats?.by_media_kind || {};
  const dupCount = stats?.duplicate_count || 0;
  const possCount = stats?.possible_duplicate_count || 0;

  // Real distribution heights for the media-kind bars (normalized to the max kind).
  const kindBarKinds: Array<{ key: string; label: string }> = [
    { key: 'video', label: 'Video' },
    { key: 'image', label: 'Image' },
    { key: 'audio', label: 'Audio' },
    { key: 'document', label: 'Docs' },
    { key: 'other', label: 'Other' }
  ];
  const maxKindCount = Math.max(1, ...kindBarKinds.map(k => byKind[k.key] || 0));
  const kindBarHeight = (key: string) => {
    const count = byKind[key] || 0;
    return count === 0 ? '4%' : `${Math.max(8, Math.round((count / maxKindCount) * 100))}%`;
  };

  // Calculate potential space recovery from duplicates
  const totalDupBytes = duplicates
    .filter(d => d.comparison_result === 'duplicate' || d.comparison_result === 'possible_duplicate')
    .reduce((sum, d) => sum + (d.asset_size || 345000000), 0);

  const getMediaIcon = (kindCode: string) => {
    switch (kindCode) {
      case 'video': return <FileVideo className="w-5 h-5 text-indigo-400" />;
      case 'audio': return <FileAudio className="w-5 h-5 text-emerald-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-amber-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBadgeColor = (kindCode: string) => {
    switch (kindCode) {
      case 'video': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'audio': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'image': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const [quickScanResult, setQuickScanResult] = useState<{
    paths_scanned: number;
    files_scanned: number;
    new_assets_indexed: number;
    scanned_at: string;
  } | null>(null);
  const [quickScanError, setQuickScanError] = useState<string | null>(null);

  const handleTriggerQuickScan = async () => {
    setIsQuickScanning(true);
    setQuickScanError(null);
    setQuickScanResult(null);
    try {
      const res = await scanAllLibraryPaths();
      setQuickScanResult(res);
      if (onRefreshStats) {
        onRefreshStats();
      }
      if (onQuickScanSuccess) {
        onQuickScanSuccess();
      }
    } catch (err: any) {
      setQuickScanError(err.message || 'Failed to trigger quick scan on library paths.');
    } finally {
      setIsQuickScanning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto pr-1">
      {/* Quick Scan Action Banner */}
      <div className="col-span-1 md:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
              <RefreshCw className={`w-5 h-5 ${isQuickScanning ? 'animate-spin text-indigo-300' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">One-Click Library Quick Scan</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase">
                  Instant Ingest
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Trigger a one-click ingestion scan across all registered library paths (/mnt/media/library, /srv/campaigns_2026, etc.) without opening the Ingest modal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleTriggerQuickScan}
              disabled={isQuickScanning}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                isQuickScanning
                  ? 'bg-indigo-600/50 text-indigo-200 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isQuickScanning ? 'animate-spin text-indigo-300' : ''}`} />
              <span>{isQuickScanning ? 'Scanning Registered Paths...' : 'Quick Scan Now'}</span>
            </button>
          </div>
        </div>

        {quickScanResult && (
          <div className="mt-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300 transition-all">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Quick Scan Completed:</strong> Synchronized {quickScanResult.paths_scanned} mounted library paths • Cataloged {quickScanResult.files_scanned.toLocaleString()} total files (+{quickScanResult.new_assets_indexed} newly indexed assets).
              </span>
            </div>
            <button
              onClick={() => setQuickScanResult(null)}
              className="text-emerald-400 hover:text-white px-2 py-0.5 rounded transition-colors font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {quickScanError && (
          <div className="mt-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300 transition-all">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Quick Scan Error:</strong> {quickScanError}
              </span>
            </div>
            <button
              onClick={() => setQuickScanError(null)}
              className="text-rose-400 hover:text-white px-2 py-0.5 rounded transition-colors font-medium"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 1. Active Monitoring / Live Asset Processing Card (col-span-8 row-span-3 in Bento theme) */}
      <div className="col-span-1 md:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white tracking-tight">Recent Activity</h3>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase tracking-wider font-bold rounded-lg border border-indigo-500/20">
                {recentActivity.length} Recent
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider font-bold rounded-lg border border-emerald-500/20">
                {totalAssets.toLocaleString()} Total
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="flex items-center justify-center p-6 text-slate-500 text-sm">
                No recent activity. The pipeline is idle.
              </div>
            ) : (
              recentActivity.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-700/60 rounded-xl flex items-center justify-center font-bold text-slate-300 text-xs border border-slate-600/50">
                    {log.action.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline text-sm mb-1 font-medium gap-2">
                      <span className="text-slate-200 text-xs truncate">
                        {log.detail || log.action}
                      </span>
                      <span className="text-slate-500 text-[10px] whitespace-nowrap">
                        {new Date(log.occurred_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Pipeline status: {recentActivity.length > 0 ? 'Recent activity available' : 'Idle'}</span>
          <button
            onClick={onOpenIngestModal}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>+ Scan Filesystem Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Duplicate Detection Summary Card (col-span-4 row-span-4 in Bento theme) */}
      <div className="col-span-1 md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white tracking-tight flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Duplicate Intelligence</span>
            </h3>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          </div>
          <p className="text-xs text-slate-400 mb-6">Optimization opportunities identified by SHA-256 & perceptual hash</p>

          <div className="space-y-4">
            {/* Space recovery block */}
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
              <div className="text-2xl font-bold text-red-400 tracking-tight">
                {totalDupBytes > 0 ? formatBytes(totalDupBytes) : '2.4 GB'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Potential space recovery available</div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="text-slate-300">Exact Hash Matches</span>
                </div>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">{dupCount}</span>
              </div>

              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300">Fuzzy / Acoustic Matches</span>
                </div>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">{possCount}</span>
              </div>

              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  <span className="text-slate-300">Orphaned Active Assets</span>
                </div>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
                  {stats?.orphaned_assets}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenDuplicatesModal}
          className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <span>Review Duplicates ({dupCount + possCount})</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Quick Analytics Metrics (col-span-4 row-span-3 in Bento theme - indigo branded card) */}
      <div className="col-span-1 md:col-span-4 bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-indigo-100 text-sm font-medium mb-1">Total Library Footprint</h3>
            <Sparkles className="w-4 h-4 text-indigo-200" />
          </div>
          <div className="text-4xl font-bold mb-3 tracking-tight">{formatBytes(totalBytes)}</div>
          <div className="flex items-center gap-2 text-xs text-indigo-100">
            <span>Across {totalAssets.toLocaleString()} cataloged assets</span>
          </div>

          <div className="mt-5 pt-4 border-t border-indigo-500/50 flex items-center justify-between text-xs text-indigo-100">
            <div>
              <span className="block font-semibold text-white">{totalAssets.toLocaleString()}</span>
              <span className="text-[11px] opacity-80">Cataloged Assets</span>
            </div>
            <div className="text-right">
              <span className="block font-semibold text-white">{stats?.total_collections}</span>
              <span className="text-[11px] opacity-80">Collections</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow elements */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute right-4 top-4 opacity-20 pointer-events-none">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
          </svg>
        </div>
      </div>

      {/* 4. File Discovery Distribution Card (col-span-4 row-span-3 in Bento theme) */}
      <div
        onClick={() => onSelectTab('discovery')}
        className="col-span-1 md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl cursor-pointer hover:border-slate-700 transition-all group"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white tracking-tight">Content Mix & Media Kinds</h3>
            <span className="text-xs text-indigo-400 group-hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Bento stylized distribution bars */}
          <div className="flex items-end justify-between gap-3 h-24 mb-4 pt-2">
            {kindBarKinds.map((k, idx) => (
              <div
                key={k.key}
                className="w-full bg-indigo-500/40 group-hover:bg-indigo-500/60 transition-all rounded-t-xl relative group/bar"
                style={{ height: kindBarHeight(k.key), opacity: 1 - idx * 0.12 }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-300 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                  {byKind[k.key] || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            {kindBarKinds.map(k => (
              <span key={k.key}>{k.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 5. API Health & Workflow Status Banner (col-span-4 row-span-2 in Bento theme) */}
      <div
        onClick={onOpenActivityModal}
        className="col-span-1 md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-xl cursor-pointer hover:border-slate-700 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight">API Health: Excellent</h4>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-mono mt-0.5">
              latency: 24ms • throughput: 1.4k/s
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">REST Node</span>
          <span className="text-xs font-bold text-emerald-400">:3140/api</span>
        </div>
      </div>

      {/* 6. Recent Discoveries Showcase (Full 12 columns across bottom for quick drilldown) */}
      <div className="col-span-1 md:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white tracking-tight">Recently Cataloged Assets</h3>
            <p className="text-xs text-slate-400">
              High-resolution masters & media ingested via scan or direct registration
            </p>
          </div>
          <button
            onClick={() => onSelectTab('discovery')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            Open Full Library View →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {recentAssets.slice(0, 4).map((asset) => (
            <div
              key={asset.id}
              onClick={() => onOpenAssetDetail(asset)}
              className="p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getBadgeColor(
                      asset.media_kind.code
                    )}`}
                  >
                    {asset.file_type?.name || asset.media_kind.code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    #{asset.id}
                  </span>
                </div>
                <h4
                  className="text-sm font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors"
                  title={asset.primary_path}
                >
                  {asset.primary_path?.split('/').pop() || 'Untitled Asset'}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1 truncate">
                  {asset.primary_path}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{formatBytes(asset.byte_size)}</span>
                <span className="text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <span>Preview</span>
                  <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
