/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BentoDashboard } from './components/BentoDashboard';
import { DiscoveryTable } from './components/DiscoveryTable';
import { DuplicatesView } from './components/DuplicatesView';
import { AnalyticsView } from './components/AnalyticsView';
import { CollectionsView } from './components/CollectionsView';
import {
  IngestModal,
  PlaybackModal,
  AssetDetailModal,
  ActivityAuditModal,
  LibraryManagementModal
} from './components/Modals';
import {
  AssetSummary,
  AssetDetail,
  DuplicatePair,
  LibraryStats,
  CollectionItem,
  Tag,
  FileType,
  MediaKind,
  PlaybackInfo,
  ActivityLogItem,
  ThemeMode
} from './types';
import {
  fetchStats,
  fetchAssets,
  fetchDuplicates,
  fetchBrowseSummary,
  fetchCollections,
  fetchTags,
  fetchFileTypes,
  fetchMediaKinds,
  fetchPlaybackInfo,
  fetchAssetDetail,
  fetchActivityLogs,
  triggerIngestScan,
  registerSingleAsset,
  renameAssetPath,
  deleteAsset,
  bulkDeleteAssets,
  resolveDuplicatePair,
  createCollection,
  createTag,
  addTagToAsset
} from './services/api';

export default function App() {
  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'duplicates' | 'analytics' | 'collections'>('dashboard');

  // Core Data States
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [browseSummary, setBrowseSummary] = useState<any[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [mediaKinds, setMediaKinds] = useState<MediaKind[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  // Loading States
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  // Modal States
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedPlayback, setSelectedPlayback] = useState<PlaybackInfo | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AssetDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('dam_theme') as ThemeMode) || 'dark';
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('dam_theme', newTheme);
    showToast(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
  };

  // Initial reference vocabulary fetch
  useEffect(() => {
    async function loadVocabularies() {
      try {
        const [ft, mk, tg, cols] = await Promise.all([
          fetchFileTypes(),
          fetchMediaKinds(),
          fetchTags(),
          fetchCollections()
        ]);
        setFileTypes(ft);
        setMediaKinds(mk);
        setTags(tg);
        setCollections(cols);
      } catch (err) {
        console.error('Failed loading base vocabularies:', err);
      }
    }
    loadVocabularies();
  }, []);

  // Refresh Stats & Summary
  const refreshStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [st, bs] = await Promise.all([
        fetchStats(),
        fetchBrowseSummary()
      ]);
      setStats(st);
      setBrowseSummary(bs);
    } catch (err) {
      console.error('Failed refreshing stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Refresh Catalog Assets
  const refreshAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    try {
      const data = await fetchAssets({
        search: searchQuery || undefined,
        media_kind: selectedKind === 'all' ? undefined : selectedKind,
        file_type_id: selectedTypeId,
        include_deleted: showDeleted,
        limit: 100
      });
      setAssets(data);
    } catch (err) {
      console.error('Failed fetching assets:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  }, [searchQuery, selectedKind, selectedTypeId, showDeleted]);

  // Refresh Duplicates
  const refreshDuplicates = useCallback(async () => {
    setIsLoadingDuplicates(true);
    try {
      const data = await fetchDuplicates();
      setDuplicates(data);
    } catch (err) {
      console.error('Failed loading duplicates:', err);
    } finally {
      setIsLoadingDuplicates(false);
    }
  }, []);

  // Refresh Activity Logs
  const refreshActivity = useCallback(async () => {
    try {
      const logs = await fetchActivityLogs(10);
      setActivityLogs(logs);
    } catch (err) {
      console.error('Failed loading activity logs:', err);
    }
  }, []);

  // Refresh Collections & Tags
  const refreshCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const [cols, tgs] = await Promise.all([
        fetchCollections(),
        fetchTags()
      ]);
      setCollections(cols);
      setTags(tgs);
    } catch (err) {
      console.error('Failed loading collections:', err);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  // Trigger loading when tab changes
  useEffect(() => {
    refreshStats();
    refreshActivity();
    if (activeTab === 'dashboard' || activeTab === 'catalog' || activeTab === 'discovery') {
      refreshAssets();
    }
    if (activeTab === 'dashboard' || activeTab === 'duplicates') {
      refreshDuplicates();
    }
    if (activeTab === 'collections') {
      refreshCollections();
    }
  }, [activeTab, refreshStats, refreshAssets, refreshDuplicates, refreshCollections, refreshActivity]);

  // Also refresh assets when search/filter inputs change
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'catalog' || activeTab === 'discovery') {
      refreshAssets();
    }
  }, [searchQuery, selectedKind, selectedTypeId, showDeleted, refreshAssets]);

  // Actions
  const handleOpenPlayModal = async (asset: AssetSummary) => {
    setIsPlayModalOpen(true);
    setIsLoadingPlayback(true);
    setSelectedPlayback(null);
    try {
      const info = await fetchPlaybackInfo(asset.id);
      setSelectedPlayback(info);
    } catch (err) {
      showToast('Failed to load playback stream info', 'error');
    } finally {
      setIsLoadingPlayback(false);
    }
  };

  const handleOpenDetailModal = async (asset: AssetSummary) => {
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);
    setSelectedDetail(null);
    try {
      const detail = await fetchAssetDetail(asset.id);
      setSelectedDetail(detail);
    } catch (err) {
      showToast('Failed to load asset canonical metadata', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleOpenAuditModal = async () => {
    setIsAuditModalOpen(true);
    setIsLoadingLogs(true);
    try {
      const logs = await fetchActivityLogs(50);
      setActivityLogs(logs);
    } catch (err) {
      showToast('Failed to load activity logs', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleRenameAsset = async (asset: AssetSummary, newPath: string) => {
    await renameAssetPath(asset.id, newPath);
    showToast(`Renamed to "${newPath}"`, 'success');
    refreshAssets();
    refreshStats();
  };

  const handleDeleteAsset = async (assetId: number, permanent = false) => {
    await deleteAsset(assetId, permanent);
    showToast(permanent ? 'Asset permanently deleted' : 'Asset soft-deleted', 'info');
    refreshAssets();
    refreshStats();
  };

  const handleBulkDelete = async (assetIds: number[], permanent = false) => {
    await bulkDeleteAssets(assetIds, permanent);
    showToast(
      `${assetIds.length} assets ${permanent ? 'permanently deleted' : 'soft-deleted'}`,
      'info'
    );
    refreshAssets();
    refreshStats();
  };

  const handleAddTagToAsset = async (assetId: number, tagIds: number[]) => {
    await addTagToAsset(assetId, tagIds);
    showToast('Applied tag to asset', 'success');
    refreshAssets();
  };

  const handleResolveDuplicate = async (
    pairId: number,
    resolution: 'duplicate' | 'not_duplicate' | 'manual_override'
  ) => {
    await resolveDuplicatePair(pairId, resolution);
    showToast(`Resolved duplicate pair as: ${resolution.replace('_', ' ')}`, 'success');
    refreshDuplicates();
    refreshStats();
  };

  const handleCreateCollection = async (name: string, typeCode: string, parentId?: number) => {
    await createCollection(name, typeCode, parentId);
    showToast(`Created collection "${name}"`, 'success');
    refreshCollections();
  };

  const handleCreateTag = async (name: string, parentId?: number | null) => {
    await createTag(name, parentId);
    showToast(`Added controlled tag "#${name}"`, 'success');
    refreshCollections();
  };

  // Calculated count for badge alerts
  const unresolvedDupCount = useMemo(() => {
    return duplicates.filter(
      d => d.comparison_result === 'duplicate' || d.comparison_result === 'possible_duplicate'
    ).length;
  }, [duplicates]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification Bar */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-500/40'
              : toastMessage.type === 'info'
              ? 'bg-slate-900/90 text-slate-200 border-slate-700'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/40'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalAssets={stats?.total_assets || 16200}
        unresolvedDuplicates={unresolvedDupCount}
        onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedKind={selectedKind}
          onSelectKind={setSelectedKind}
          onOpenIngestModal={() => setIsIngestModalOpen(true)}
          onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
          onOpenAuditModal={handleOpenAuditModal}
          stats={stats}
        />

        {/* Dynamic Main Stage View */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/50">
          {activeTab === 'dashboard' && (
            <BentoDashboard
              stats={stats}
              browseSummary={browseSummary}
              duplicates={duplicates}
              recentAssets={assets.slice(0, 7)}
              recentActivity={activityLogs}
              onNavigateToCatalog={() => setActiveTab('discovery')}
              onNavigateToDuplicates={() => setActiveTab('duplicates')}
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
              onRefreshStats={refreshStats}
              onQuickScanSuccess={() => {
                showToast('Library scan completed & catalog refreshed', 'success');
                refreshAssets();
                refreshActivity();
              }}
              onOpenPlayModal={handleOpenPlayModal}
              onOpenDetailModal={handleOpenDetailModal}
            />
          )}

          {(activeTab === 'catalog' || activeTab === 'discovery') && (
            <DiscoveryTable
              assets={assets}
              isLoading={isLoadingAssets}
              fileTypes={fileTypes}
              mediaKinds={mediaKinds}
              availableTags={tags}
              selectedKind={selectedKind}
              onSelectKind={setSelectedKind}
              selectedTypeId={selectedTypeId}
              onSelectTypeId={setSelectedTypeId}
              showDeleted={showDeleted}
              onToggleDeleted={() => setShowDeleted(!showDeleted)}
              onOpenPlayModal={handleOpenPlayModal}
              onOpenDetailModal={handleOpenDetailModal}
              onRenameAsset={handleRenameAsset}
              onDeleteAsset={handleDeleteAsset}
              onBulkDelete={handleBulkDelete}
              onAddTagToAsset={handleAddTagToAsset}
              onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
            />
          )}

          {activeTab === 'duplicates' && (
            <DuplicatesView
              duplicates={duplicates}
              onResolveDuplicate={handleResolveDuplicate}
              isLoading={isLoadingDuplicates}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              stats={stats}
              browseSummary={browseSummary}
              isLoading={isLoadingStats}
            />
          )}

          {activeTab === 'collections' && (
            <CollectionsView
              collections={collections}
              tags={tags}
              onCreateCollection={handleCreateCollection}
              onCreateTag={handleCreateTag}
              isLoading={isLoadingCollections}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        fileTypes={fileTypes}
        onTriggerScan={triggerIngestScan}
        onRegisterSingle={registerSingleAsset}
        onSuccess={() => {
          showToast('Ingest operation completed & catalog updated', 'success');
          refreshStats();
          refreshAssets();
        }}
      />

      <LibraryManagementModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSuccess={() => {
          showToast('Library path registered & mounted successfully', 'success');
          refreshStats();
          refreshAssets();
        }}
      />

      <PlaybackModal
        isOpen={isPlayModalOpen}
        onClose={() => setIsPlayModalOpen(false)}
        playbackInfo={selectedPlayback}
        isLoading={isLoadingPlayback}
      />

      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        detail={selectedDetail}
        isLoading={isLoadingDetail}
      />

      <ActivityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={activityLogs}
        isLoading={isLoadingLogs}
      />
    </div>
  );
}

