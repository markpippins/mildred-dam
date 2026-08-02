import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Tag as TagIcon,
  Play,
  Edit3,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  FolderInput,
  RotateCcw,
  FileText,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  HardDrive,
  Server,
  Cloud,
  Plus,
  RefreshCw,
  CheckCircle2,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';
import { AssetSummary, FileType, MediaKind, Tag, LibraryPath } from '../types';
import {
  formatBytes,
  fetchLibraryPaths,
  addLibraryPath,
  deleteLibraryPath,
  scanLibraryPath
} from '../services/api';

interface DiscoveryTableProps {
  assets: AssetSummary[];
  isLoading: boolean;
  fileTypes: FileType[];
  mediaKinds: MediaKind[];
  availableTags: Tag[];
  selectedKind: string;
  onSelectKind: (kind: string) => void;
  selectedTypeId: number | undefined;
  onSelectTypeId: (typeId: number | undefined) => void;
  showDeleted: boolean;
  onToggleDeleted: () => void;
  onOpenPlayModal: (asset: AssetSummary) => void;
  onOpenDetailModal: (asset: AssetSummary) => void;
  onRenameAsset: (asset: AssetSummary, newPath: string) => Promise<void>;
  onDeleteAsset: (assetId: number, permanent?: boolean) => Promise<void>;
  onBulkDelete: (assetIds: number[], permanent?: boolean) => Promise<void>;
  onAddTagToAsset: (assetId: number, tagIds: number[]) => Promise<void>;
  onOpenLibraryModal?: () => void;
}

export const DiscoveryTable: React.FC<DiscoveryTableProps> = ({
  assets,
  isLoading,
  fileTypes,
  mediaKinds,
  availableTags,
  selectedKind,
  onSelectKind,
  selectedTypeId,
  onSelectTypeId,
  showDeleted,
  onToggleDeleted,
  onOpenPlayModal,
  onOpenDetailModal,
  onRenameAsset,
  onDeleteAsset,
  onBulkDelete,
  onAddTagToAsset,
  onOpenLibraryModal
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [taggingId, setTaggingId] = useState<number | null>(null);
  const [selectedTagToAdd, setSelectedTagToAdd] = useState<number>(availableTags[0]?.id || 1);

  // Library Paths Mounts & Storage Vaults State
  const [libraryPaths, setLibraryPaths] = useState<LibraryPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(false);
  const [showAddPathForm, setShowAddPathForm] = useState(false);
  const [newPathName, setNewPathName] = useState('');
  const [newPathDir, setNewPathDir] = useState('');
  const [newPathKind, setNewPathKind] = useState<'local' | 'nfs' | 's3' | 'other'>('local');
  const [newPathWatch, setNewPathWatch] = useState(true);
  const [scanningPathId, setScanningPathId] = useState<number | null>(null);
  const [pathActionMessage, setPathActionMessage] = useState<string | null>(null);
  const [isPathsExpanded, setIsPathsExpanded] = useState(true);

  useEffect(() => {
    async function loadPaths() {
      setIsLoadingPaths(true);
      try {
        const paths = await fetchLibraryPaths();
        setLibraryPaths(paths);
      } catch (err) {
        console.error('Failed to load library paths:', err);
      } finally {
        setIsLoadingPaths(false);
      }
    }
    loadPaths();
  }, []);

  const handleAddPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPathDir.trim()) return;
    try {
      const added = await addLibraryPath(
        newPathName.trim() || newPathDir.trim().split('/').pop() || newPathDir.trim(),
        newPathDir.trim(),
        newPathKind,
        newPathWatch
      );
      setLibraryPaths(prev => [added, ...prev]);
      setNewPathName('');
      setNewPathDir('');
      setShowAddPathForm(false);
      setPathActionMessage(`Mounted new library path "${added.path}" successfully`);
      setTimeout(() => setPathActionMessage(null), 4000);
    } catch (err) {
      alert('Failed to mount library path');
    }
  };

  const handleScanPath = async (id: number, name: string) => {
    setScanningPathId(id);
    try {
      await scanLibraryPath(id);
      const updated = await fetchLibraryPaths();
      setLibraryPaths(updated);
      setPathActionMessage(`Scan completed for "${name}": directory synchronized`);
      setTimeout(() => setPathActionMessage(null), 4000);
    } catch (err) {
      alert('Failed to scan path');
    } finally {
      setScanningPathId(null);
    }
  };

  const handleDeletePath = async (id: number, name: string) => {
    if (!window.confirm(`Unmount and remove library path "${name}"? Catalog entries will be unlinked.`)) {
      return;
    }
    try {
      await deleteLibraryPath(id);
      setLibraryPaths(prev => prev.filter(p => p.id !== id));
      setPathActionMessage(`Unmounted library path "${name}"`);
      setTimeout(() => setPathActionMessage(null), 4000);
    } catch (err) {
      alert('Failed to delete library path');
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

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length && assets.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const startRename = (asset: AssetSummary) => {
    setRenamingId(asset.id);
    setRenameInput(asset.primary_path || '');
  };

  const submitRename = async (asset: AssetSummary) => {
    if (!renameInput.trim() || renameInput === asset.primary_path) {
      setRenamingId(null);
      return;
    }
    try {
      await onRenameAsset(asset, renameInput.trim());
      setRenamingId(null);
    } catch (err) {
      alert('Failed to rename asset');
    }
  };

  const submitTagging = async (assetId: number) => {
    if (!selectedTagToAdd) return;
    try {
      await onAddTagToAsset(assetId, [Number(selectedTagToAdd)]);
      setTaggingId(null);
    } catch (err) {
      alert('Failed to apply tag');
    }
  };

  const handleBulkDelete = async (permanent: boolean) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'soft-delete'} ${selectedIds.length} assets?`)) {
      return;
    }
    await onBulkDelete(selectedIds, permanent);
    setSelectedIds([]);
  };

  const getMediaIcon = (kindCode: string) => {
    switch (kindCode) {
      case 'video': return <FileVideo className="w-4 h-4 text-indigo-400" />;
      case 'audio': return <FileAudio className="w-4 h-4 text-emerald-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-amber-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. MOUNTED LIBRARY PATHS & STORAGE VAULTS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Mounted Library Paths & Storage Vaults
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                  {libraryPaths.length} Active Mounts
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure local filesystems, NFS archive directories, and S3 buckets scanned by Mildred DAM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLibraryModal && (
              <button
                onClick={onOpenLibraryModal}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Library Manager Modal</span>
              </button>
            )}

            <button
              onClick={() => setShowAddPathForm(!showAddPathForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddPathForm ? 'Close Form' : '+ Add Library Path'}</span>
            </button>

            <button
              onClick={() => setIsPathsExpanded(!isPathsExpanded)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/60 transition-colors"
              title={isPathsExpanded ? 'Collapse Section' : 'Expand Section'}
            >
              {isPathsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action / Success Banner */}
        {pathActionMessage && (
          <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pathActionMessage}</span>
          </div>
        )}

        {/* Expandable Body */}
        {isPathsExpanded && (
          <div className="p-6 space-y-6">
            {/* Inline Add Library Path Form */}
            {showAddPathForm && (
              <form
                onSubmit={handleAddPath}
                className="p-5 bg-slate-950/80 border border-indigo-500/30 rounded-2xl space-y-4 shadow-inner"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-indigo-400" />
                    <span>Mount New Filesystem Vault or Storage Path</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Auto-index on save
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Vault / Library Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hi-Res Master Audio Vault"
                      value={newPathName}
                      onChange={(e) => setNewPathName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Filesystem / Storage URI <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. /mnt/media/audio_vault or s3://mildred-archive"
                      value={newPathDir}
                      onChange={(e) => setNewPathDir(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Storage Kind
                    </label>
                    <select
                      value={newPathKind}
                      onChange={(e) => setNewPathKind(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="local">Local Filesystem (/mnt/...)</option>
                      <option value="nfs">NFS Network Share</option>
                      <option value="s3">Amazon S3 Cloud Bucket</option>
                      <option value="other">Other Remote Mount</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPathWatch}
                      onChange={(e) => setNewPathWatch(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                    <span>Enable real-time filesystem watch & automatic indexing</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddPathForm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      Mount & Index Path
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Grid of Configured Library Paths */}
            {isLoadingPaths ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Loading mounted library paths...
              </div>
            ) : libraryPaths.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <FolderPlus className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No Library Paths Configured Yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Add your storage folders or NFS mounts to begin scanning and cataloging assets.
                </p>
                <button
                  onClick={() => setShowAddPathForm(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Mount First Library Path</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryPaths.map((path) => {
                  const isScanning = scanningPathId === path.id;
                  return (
                    <div
                      key={path.id}
                      className="p-5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        {/* Top row badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                              {getStorageIcon(path.storage_kind)}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {path.storage_kind === 's3' ? 'S3 Bucket' : path.storage_kind === 'nfs' ? 'NFS Mount' : 'Local FS'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>ACTIVE</span>
                          </div>
                        </div>

                        {/* Title & Path */}
                        <h4 className="text-sm font-bold text-white tracking-tight truncate">
                          {path.name}
                        </h4>
                        <p
                          className="text-xs text-slate-400 font-mono truncate mt-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/80"
                          title={path.path}
                        >
                          {path.path}
                        </p>

                        {/* Stats Info */}
                        <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                              Indexed Files
                            </span>
                            <span className="font-semibold text-slate-200">
                              {path.file_count?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                              Total Volume
                            </span>
                            <span className="font-semibold text-slate-200">
                              {formatBytes(path.total_bytes || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          {path.watch_enabled ? 'Real-Time Watcher' : 'Manual Scan Only'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleScanPath(path.id, path.name)}
                            disabled={isScanning}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                              isScanning
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 cursor-wait'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                            }`}
                            title="Scan folder now"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-indigo-400' : ''}`} />
                            <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
                          </button>

                          <button
                            onClick={() => handleDeletePath(path.id, path.name)}
                            className="p-1.5 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-xl border border-slate-800 hover:border-red-500/30 transition-colors"
                            title="Unmount library path"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. ASSET CATALOG & FILESYSTEM INDEX TABLE */}
      <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Table Filter Toolbar */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
          {/* Media Kind Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => onSelectKind('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedKind === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Media
          </button>
          {mediaKinds.map(mk => (
            <button
              key={mk.code}
              onClick={() => onSelectKind(mk.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase transition-all ${
                selectedKind === mk.code
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mk.code}
            </button>
          ))}
        </div>

        {/* Right filters: File type dropdown & show deleted toggle */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTypeId || ''}
            onChange={(e) => onSelectTypeId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All File Types</option>
            {fileTypes.map(ft => (
              <option key={ft.id} value={ft.id}>
                {ft.name} ({ft.extension})
              </option>
            ))}
          </select>

          <button
            onClick={onToggleDeleted}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showDeleted
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{showDeleted ? 'Showing Soft-Deleted' : 'Active Only'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="px-5 py-3 bg-indigo-600/10 border-b border-indigo-500/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300">
            {selectedIds.length} {selectedIds.length === 1 ? 'asset' : 'assets'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkDelete(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Soft Delete</span>
            </button>
            <button
              onClick={() => handleBulkDelete(true)}
              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hard Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {selectedIds.length === assets.length && assets.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3">Relative Path & Name</th>
              <th className="py-3 px-3">Kind / Type</th>
              <th className="py-3 px-3">Tags</th>
              <th className="py-3 px-3">Size</th>
              <th className="py-3 px-3">First Seen</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Loading cataloged assets...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No assets found matching current filters. Try resetting search or media type.
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                const isRenaming = renamingId === asset.id;
                const isTagging = taggingId === asset.id;

                return (
                  <tr
                    key={asset.id}
                    className={`group transition-colors ${
                      asset.is_deleted
                        ? 'bg-red-500/5 opacity-60'
                        : isSelected
                        ? 'bg-indigo-500/10'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleSelectOne(asset.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Relative Path / Inline Rename */}
                    <td className="py-3.5 px-3 max-w-sm">
                      <div className="flex items-center gap-3">
                        {getMediaIcon(asset.media_kind.code)}
                        <div className="min-w-0 flex-1">
                          {isRenaming ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                className="bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-200 w-full focus:outline-none font-mono"
                                autoFocus
                              />
                              <button
                                onClick={() => submitRename(asset)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setRenamingId(null)}
                                className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                                <span>{asset.primary_path?.split('/').pop() || 'Untitled'}</span>
                                {asset.is_deleted && (
                                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                    Deleted
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono truncate">
                                {asset.primary_path}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Kind & Type */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-300 font-medium">
                        {asset.file_type?.name || asset.media_kind.code.toUpperCase()}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {(asset.tags || []).map((t: any) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[11px] font-medium"
                          >
                            #{t.name}
                          </span>
                        ))}

                        {isTagging ? (
                          <div className="flex items-center gap-1 mt-1">
                            <select
                              value={selectedTagToAdd}
                              onChange={(e) => setSelectedTagToAdd(Number(e.target.value))}
                              className="bg-slate-950 border border-indigo-500 text-slate-200 text-xs rounded px-1.5 py-0.5"
                            >
                              {availableTags.map(tag => (
                                <option key={tag.id} value={tag.id}>
                                  #{tag.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => submitTagging(asset.id)}
                              className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs"
                            >
                              +
                            </button>
                            <button
                              onClick={() => setTaggingId(null)}
                              className="text-xs text-slate-400 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setTaggingId(asset.id);
                              setSelectedTagToAdd(availableTags[0]?.id || 1);
                            }}
                            className="px-1.5 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition-colors"
                            title="Add Tag"
                          >
                            + tag
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                      {formatBytes(asset.byte_size)}
                    </td>

                    {/* First Seen */}
                    <td className="py-3.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(asset.first_seen_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Row Quick Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        {/* Play / Stream Modal Button */}
                        <button
                          onClick={() => onOpenPlayModal(asset)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg border border-slate-700 transition-all"
                          title="Stream / Playback & Rendition Inspection"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Inspector Drawer Button */}
                        <button
                          onClick={() => onOpenDetailModal(asset)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                          title="View Full Metadata Canonical View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Rename Path Button */}
                        <button
                          onClick={() => startRename(asset)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                          title="Rename Relative Path"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Soft/Hard Delete Button */}
                        <button
                          onClick={() => onDeleteAsset(asset.id, false)}
                          className="p-1.5 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 rounded-lg border border-slate-700 transition-all"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};
