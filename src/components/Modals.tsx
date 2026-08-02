import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Play,
  FileText,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FolderOpen,
  Activity,
  ShieldCheck,
  Tag as TagIcon,
  RotateCcw,
  Sparkles,
  FolderPlus,
  Server,
  Cloud,
  RefreshCw,
  Trash2,
  Plus,
  AlertTriangle,
  Check,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { AssetSummary, AssetDetail, PlaybackInfo, ActivityLogItem, ScanResult, FileType, LibraryPath } from '../types';
import { formatBytes, fetchLibraryPaths, addLibraryPath, deleteLibraryPath, scanLibraryPath } from '../services/api';

// --- 1. INGEST / FILESYSTEM SCAN MODAL ---
interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileTypes: FileType[];
  onTriggerScan: (rootPath: string, dryRun: boolean) => Promise<ScanResult | null>;
  onRegisterSingle: (payload: {
    content_hash: string;
    file_type_id: number;
    byte_size: number;
    relative_path: string;
  }) => Promise<number | null>;
  onSuccess: () => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  fileTypes,
  onTriggerScan,
  onRegisterSingle,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'single'>('scan');
  const [rootPath, setRootPath] = useState('/media/library');
  const [dryRun, setDryRun] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Single asset form state
  const [relativePath, setRelativePath] = useState('');
  const [fileTypeId, setFileTypeId] = useState<number>(fileTypes[0]?.id || 1);
  const [byteSize, setByteSize] = useState<number>(45000000);
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await onTriggerScan(rootPath, dryRun);
      if (res) {
        setScanResult(res);
        if (!dryRun) onSuccess();
      }
    } catch (err) {
      alert('Ingest scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegisterSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relativePath.trim()) return;
    setIsRegistering(true);
    try {
      // Generate deterministic demo SHA-256 hash for display
      const pseudoHash = 'a8f9c' + Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
      const newId = await onRegisterSingle({
        content_hash: pseudoHash,
        file_type_id: Number(fileTypeId),
        byte_size: Number(byteSize),
        relative_path: relativePath.trim()
      });
      if (newId) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert('Single registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Ingest & Asset Discovery</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800/80">
          <button
            onClick={() => { setActiveTab('scan'); setScanResult(null); }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'scan'
                ? 'text-indigo-400 border-indigo-500 bg-slate-800/50'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            POST /api/ingest/scan (Filesystem Walk)
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'single'
                ? 'text-indigo-400 border-indigo-500 bg-slate-800/50'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            POST /api/ingest/register (Single Asset)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'scan' ? (
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Storage Location Root Path
                </label>
                <input
                  type="text"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  placeholder="/media/library"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <input
                  type="checkbox"
                  id="dryRunToggle"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="dryRunToggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Dry Run — classify & simulate import without writing to catalog
                </label>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isScanning ? (
                  <span>Walking filesystem & SHA-256 hashing...</span>
                ) : (
                  <span>Trigger Filesystem Scan</span>
                )}
              </button>

              {scanResult && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Scan Completed Successfully!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 font-mono">
                    <div>Scanned: <span className="font-bold text-white">{scanResult.files_scanned}</span></div>
                    <div>New Assets: <span className="font-bold text-emerald-400">+{scanResult.new_assets}</span></div>
                    <div>Existing: <span className="font-bold text-slate-400">{scanResult.existing_assets}</span></div>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegisterSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Relative File Path (relative to storage root)
                </label>
                <input
                  type="text"
                  value={relativePath}
                  onChange={(e) => setRelativePath(e.target.value)}
                  placeholder="albums/artist/track01.flac or campaigns/hero_01.jpg"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    File Type Classification
                  </label>
                  <select
                    value={fileTypeId}
                    onChange={(e) => setFileTypeId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {fileTypes.map(ft => (
                      <option key={ft.id} value={ft.id}>
                        {ft.name} ({ft.extension})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Byte Size
                  </label>
                  <input
                    type="number"
                    value={byteSize}
                    onChange={(e) => setByteSize(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering || !relativePath.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
              >
                {isRegistering ? 'Registering Asset...' : 'Register Asset in Catalog'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 2. ASSET PLAYBACK & RENDITION INSPECTOR MODAL ---
interface PlaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbackInfo: PlaybackInfo | null;
  isLoading: boolean;
}

export const PlaybackModal: React.FC<PlaybackModalProps> = ({
  isOpen,
  onClose,
  playbackInfo,
  isLoading
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Play className="w-5 h-5 text-indigo-400 fill-current" />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Media Playback & Rendition Viewer</h3>
              <span className="text-xs text-indigo-400 font-mono">GET /api/assets/{playbackInfo?.asset_id}/play</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading || !playbackInfo ? (
            <div className="py-12 text-center text-slate-500">Loading playback URI and renditions...</div>
          ) : (
            <>
              {/* Simulated Media Player Stage */}
              <div className="w-full h-56 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                {/* Decorative audio wave / visualizer simulation */}
                <div className="flex items-end gap-1 h-20 mb-3 opacity-80">
                  <div className={`w-2.5 bg-indigo-500 rounded-full transition-all ${isPlaying ? 'h-16 animate-bounce' : 'h-6'}`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2.5 bg-indigo-400 rounded-full transition-all ${isPlaying ? 'h-20 animate-bounce' : 'h-10'}`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2.5 bg-emerald-400 rounded-full transition-all ${isPlaying ? 'h-14 animate-bounce' : 'h-8'}`} style={{ animationDelay: '300ms' }}></div>
                  <div className={`w-2.5 bg-indigo-500 rounded-full transition-all ${isPlaying ? 'h-18 animate-bounce' : 'h-12'}`} style={{ animationDelay: '75ms' }}></div>
                  <div className={`w-2.5 bg-indigo-400 rounded-full transition-all ${isPlaying ? 'h-10 animate-bounce' : 'h-4'}`} style={{ animationDelay: '220ms' }}></div>
                </div>

                <div className="text-sm font-mono text-slate-200 max-w-md truncate px-4">
                  {playbackInfo.primary_path}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  MIME: <span className="text-indigo-300 font-mono">{playbackInfo.mime_type}</span> • Size: {formatBytes(playbackInfo.byte_size)}
                </div>

                {/* Play / Pause Control Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlaying ? 'Pause Stream' : 'Play Primary Stream'}</span>
                </button>
              </div>

              {/* REST API Playback Envelope Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Available Renditions & URI Paths
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-1">
                      <span>PRIMARY LOCATION</span>
                      <span>MIME: {playbackInfo.mime_type}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-300 break-all">
                      {playbackInfo.full_uri}
                    </div>
                  </div>

                  {playbackInfo.renditions.map((rend) => (
                    <div key={rend.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
                        <span className="uppercase">{rend.rendition_type}</span>
                        <span>{rend.pixel_width}x{rend.pixel_height}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-300 break-all">
                        /media/library/{rend.relative_path}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 3. ASSET CANONICAL METADATA INSPECTOR MODAL ---
interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: AssetDetail | null;
  isLoading: boolean;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Canonical Field View & Asset Details</h3>
              <span className="text-xs text-indigo-400 font-mono">GET /api/assets/{detail?.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading || !detail ? (
            <div className="py-12 text-center text-slate-500">Loading canonical metadata view...</div>
          ) : (
            <>
              {/* Asset Header Info Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold uppercase">
                    {detail.file_type.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    SHA-256: {detail.content_hash.slice(0, 16)}...
                  </span>
                </div>
                <div className="text-sm font-semibold text-white font-mono break-all">
                  {detail.file_locations?.[0]?.relative_path || 'Unassigned'}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Size: {formatBytes(detail.byte_size)}</span>
                  <span>First seen: {new Date(detail.first_seen_at).toLocaleDateString()}</span>
                  <span>Kind: {detail.media_kind.code}</span>
                </div>
              </div>

              {/* Canonical Metadata Crosswalk Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Extracted Canonical Metadata (Text/Float/Int COALESCE View)
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-2.5 px-4">Canonical Field</th>
                        <th className="py-2.5 px-4">Data Type</th>
                        <th className="py-2.5 px-4">Serialized Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {detail.metadata && detail.metadata.length > 0 ? (
                        detail.metadata.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="py-3 px-4 font-semibold text-indigo-300">{item.canonical_name}</td>
                            <td className="py-3 px-4 text-slate-400">{item.data_type}</td>
                            <td className="py-3 px-4 text-slate-200">{item.value}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-500">
                            No canonical metadata attributes recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tags and Storage Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {detail.tags && detail.tags.length > 0 ? (
                      detail.tags.map(t => (
                        <span key={t.id} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium">
                          #{t.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No tags applied.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active File Locations
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    {detail.file_locations && detail.file_locations.length > 0 ? (
                      detail.file_locations.map(fl => (
                        <div key={fl.id} className="text-xs font-mono text-emerald-400">
                          {fl.relative_path} {fl.is_primary ? '(PRIMARY)' : ''}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No active locations.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 4. ACTIVITY & AUDIT LOG MODAL ---
interface ActivityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLogItem[];
  isLoading: boolean;
}

export const ActivityAuditModal: React.FC<ActivityAuditModalProps> = ({
  isOpen,
  onClose,
  logs,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">System Audit & Activity Log</h3>
              <span className="text-xs text-emerald-400 font-mono">GET /api/activity?limit=50</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No recent activity logs recorded.</div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Occurred At</th>
                    <th className="py-3 px-3">Action Code</th>
                    <th className="py-3 px-3">Asset ID / Path</th>
                    <th className="py-3 px-4">Audit Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.occurred_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {log.asset_id ? `#${log.asset_id} • ` : ''}
                        {log.asset_path || log.collection_name || 'System event'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {log.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 5. LIBRARY MANAGEMENT & PATH INGESTION MODAL ---
interface LibraryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LibraryManagementModal: React.FC<LibraryManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [libraryPaths, setLibraryPaths] = useState<LibraryPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(false);
  const [dirPath, setDirPath] = useState('/mnt/media/audio_vault');
  const [name, setName] = useState('Hi-Res Master Audio Vault');
  const [storageKind, setStorageKind] = useState<'local' | 'nfs' | 's3' | 'other'>('local');
  const [watchEnabled, setWatchEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear communication state for success / failure
  const [successResult, setSuccessResult] = useState<{
    path: LibraryPath;
    message: string;
  } | null>(null);
  const [errorResult, setErrorResult] = useState<{
    message: string;
    pathEntered: string;
    suggestion: string;
  } | null>(null);

  // Scan feedback state for listed paths
  const [scanningPathId, setScanningPathId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPaths();
      setSuccessResult(null);
      setErrorResult(null);
    }
  }, [isOpen]);

  const loadPaths = async () => {
    setIsLoadingPaths(true);
    try {
      const paths = await fetchLibraryPaths();
      setLibraryPaths(paths);
    } catch (err) {
      console.error('Failed to load library paths:', err);
    } finally {
      setIsLoadingPaths(false);
    }
  };

  if (!isOpen) return null;

  const handleApplyPreset = (presetPath: string, presetName: string, presetKind: 'local' | 'nfs' | 's3' | 'other') => {
    setDirPath(presetPath);
    setName(presetName);
    setStorageKind(presetKind);
    setSuccessResult(null);
    setErrorResult(null);
  };

  const handleRegisterPath = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessResult(null);
    setErrorResult(null);

    const trimmed = dirPath.trim();
    if (!trimmed) {
      setErrorResult({
        message: 'Directory path cannot be empty.',
        pathEntered: trimmed,
        suggestion: 'Enter an absolute filesystem path starting with "/" or a supported storage URI scheme.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await addLibraryPath(
        name.trim() || trimmed.split('/').pop() || trimmed,
        trimmed,
        storageKind,
        watchEnabled
      );
      setSuccessResult({
        path: added,
        message: `Mounted directory "${added.path}" successfully. Indexed ${added.file_count?.toLocaleString() || 120} files (${formatBytes(added.total_bytes || 0)}).`
      });
      setLibraryPaths(prev => [added, ...prev]);
      setDirPath('');
      setName('');
      onSuccess?.();
    } catch (err: any) {
      const msg = err.message || 'Failed to register library path';
      let suggestion = 'Check Linux directory permissions (chmod 0755) and verify user read access.';
      if (msg.includes('Invalid path URI')) {
        suggestion = 'Use an absolute path starting with "/" (e.g. /mnt/media) or an explicit scheme like s3:// or nfs://.';
      } else if (msg.includes('Permission denied') || msg.includes('unreachable')) {
        suggestion = 'Verify that the NFS share or mount point is reachable and permissions allow reading.';
      }
      setErrorResult({
        message: msg,
        pathEntered: trimmed,
        suggestion
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanPath = async (id: number, pathName: string) => {
    setScanningPathId(id);
    try {
      await scanLibraryPath(id);
      await loadPaths();
      setActionFeedback(`Scan completed for "${pathName}": directory synchronized & catalog updated`);
      setTimeout(() => setActionFeedback(null), 4000);
      onSuccess?.();
    } catch (err) {
      alert('Failed to scan path');
    } finally {
      setScanningPathId(null);
    }
  };

  const handleDeletePath = async (id: number, pathName: string) => {
    if (!window.confirm(`Unmount and remove library path "${pathName}" from catalog?`)) {
      return;
    }
    try {
      await deleteLibraryPath(id);
      setLibraryPaths(prev => prev.filter(p => p.id !== id));
      setActionFeedback(`Unmounted library path "${pathName}"`);
      setTimeout(() => setActionFeedback(null), 4000);
      onSuccess?.();
    } catch (err) {
      alert('Failed to unmount path');
    }
  };

  const getStorageIcon = (kind: string) => {
    switch (kind) {
      case 'nfs':
        return <Server className="w-4 h-4 text-sky-400" />;
      case 's3':
        return <Cloud className="w-4 h-4 text-amber-400" />;
      default:
        return <HardDrive className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Library Management</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                  {libraryPaths.length} Mounted Paths
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Register local directory paths for ingestion, configure filesystem watchers, and monitor storage mounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* SECTION 1: ADD / REGISTER NEW LIBRARY PATH */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                <span>Register Local Directory Path for Ingestion</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">POST /api/library-paths</span>
            </div>

            {/* Quick Testing Preset Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Presets / Tests:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('/mnt/media/audio_vault', 'Hi-Res Master Audio Vault', 'local')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-colors"
              >
                + Local Audio Vault
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('s3://mildred-dam-archive', 'S3 Production Archive', 's3')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-colors"
              >
                + S3 Cloud Bucket
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('/mnt/archive/photo_scans', 'NFS Photo Archives', 'nfs')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-colors"
              >
                + NFS Share
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('/error/unreachable_share', 'Disconnected Share Test', 'nfs')}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-300 transition-colors font-medium"
                title="Simulates an unreachable or permission-denied directory path"
              >
                Simulate Permission Error
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('relative/invalid/path', 'Invalid Format Test', 'local')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 transition-colors font-medium"
                title="Simulates an invalid non-absolute path URI"
              >
                Simulate Invalid URI
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleRegisterPath} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Local Directory Path / URI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /mnt/media/audio_vault"
                    value={dirPath}
                    onChange={(e) => {
                      setDirPath(e.target.value);
                      setSuccessResult(null);
                      setErrorResult(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Library / Vault Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hi-Res Master Audio Vault"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Storage Kind
                  </label>
                  <select
                    value={storageKind}
                    onChange={(e) => setStorageKind(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="local">Local Filesystem (/mnt/...)</option>
                    <option value="nfs">NFS Network Share</option>
                    <option value="s3">Amazon S3 Bucket</option>
                    <option value="other">Other Remote Mount</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={watchEnabled}
                    onChange={(e) => setWatchEnabled(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <span>Enable real-time filesystem watch & automated background ingestion</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg flex items-center gap-2 ${
                    isSubmitting
                      ? 'bg-indigo-600/50 text-indigo-200 cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering & Scanning...' : 'Register Path & Ingest'}</span>
                </button>
              </div>
            </form>

            {/* CRITICAL FEATURE: CLEAR SUCCESS / FAILURE COMMUNICATION BANNER */}
            {successResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-emerald-300">Path Successfully Registered & Mounted!</h5>
                    <p className="text-xs text-emerald-200/90 mt-0.5">{successResult.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-emerald-300/80">
                      <span>• URI: {successResult.path.path}</span>
                      <span>• Status: ACTIVE</span>
                      <span>• Watcher: {successResult.path.watch_enabled ? 'ENABLED' : 'MANUAL'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleScanPath(successResult.path.id, successResult.path.name)}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-medium transition-colors"
                  >
                    Scan Path Now
                  </button>
                  <button
                    onClick={() => setSuccessResult(null)}
                    className="p-1.5 text-emerald-400 hover:text-white rounded-lg transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {errorResult && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col gap-2 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-rose-300">Path Registration Failed</h5>
                      <p className="text-xs font-mono text-rose-200/90 mt-1 bg-rose-950/60 p-2.5 rounded-lg border border-rose-500/20">
                        {errorResult.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setErrorResult(null)}
                    className="p-1.5 text-rose-400 hover:text-white rounded-lg transition-colors shrink-0"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-1 pl-11 text-xs text-rose-300/90 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    <strong>Remediation:</strong> {errorResult.suggestion}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CURRENTLY MOUNTED LIBRARY PATHS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-400" />
                <span>Active Mounted Library Paths & Storage Vaults</span>
              </h4>

              {actionFeedback && (
                <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  {actionFeedback}
                </span>
              )}
            </div>

            {isLoadingPaths ? (
              <div className="py-12 text-center text-slate-500 text-xs">Loading active mounts...</div>
            ) : libraryPaths.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">No library paths registered yet</p>
                <p className="text-xs text-slate-500 mt-1">Use the form above to register your first directory path.</p>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Vault Name & URI</th>
                      <th className="py-3 px-3">Storage Kind</th>
                      <th className="py-3 px-3">Indexed Files</th>
                      <th className="py-3 px-3">Volume</th>
                      <th className="py-3 px-3">Watcher</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {libraryPaths.map((path) => {
                      const isScanning = scanningPathId === path.id;
                      return (
                        <tr key={path.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-xs">{path.name}</div>
                            <div className="font-mono text-[11px] text-slate-400 mt-0.5">{path.path}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                              {getStorageIcon(path.storage_kind)}
                              <span className="uppercase text-[10px] font-bold">{path.storage_kind}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-200">
                            {path.file_count?.toLocaleString() || 0}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {formatBytes(path.total_bytes || 0)}
                          </td>
                          <td className="py-3 px-3">
                            {path.watch_enabled ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                                Real-Time Watch
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">
                                Manual Scan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleScanPath(path.id, path.name)}
                                disabled={isScanning}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                  isScanning
                                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 cursor-wait'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                }`}
                                title="Re-index directory now"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-400' : ''}`} />
                                <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
                              </button>

                              <button
                                onClick={() => handleDeletePath(path.id, path.name)}
                                className="p-1.5 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-xl border border-slate-800 hover:border-red-500/30 transition-colors"
                                title="Unmount path"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Path ingestion rules immediately apply to all new assets imported into Mildred DAM.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Management Window
          </button>
        </div>
      </div>
    </div>
  );
};
