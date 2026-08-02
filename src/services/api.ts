import {
  AssetSummary,
  AssetDetail,
  PlaybackInfo,
  CollectionItem,
  Tag,
  DuplicatePair,
  LibraryStats,
  ActivityLogItem,
  ScanResult
} from '../types';

const API_BASE = '/api';

export async function checkHealth(): Promise<{ status: string; db?: string; latency_ms?: number }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  const json = await res.json();
  return json.data;
}

export async function fetchAssets(params: {
  media_kind?: string;
  file_type_id?: number;
  is_deleted?: boolean;
  include_deleted?: boolean;
  search?: string;
  limit?: number;
} = {}): Promise<AssetSummary[]> {
  const url = new URL(`${API_BASE}/assets`, window.location.origin);
  if (params.media_kind) url.searchParams.set('media_kind', params.media_kind);
  if (params.file_type_id) url.searchParams.set('file_type_id', String(params.file_type_id));
  if (params.is_deleted !== undefined) url.searchParams.set('is_deleted', String(params.is_deleted));
  if (params.include_deleted !== undefined) url.searchParams.set('include_deleted', String(params.include_deleted));
  if (params.search) url.searchParams.set('search', params.search);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data || [];
}

export async function searchAssets(query: string): Promise<{
  asset: AssetSummary;
  score: number | null;
  match_on: string | null;
}[]> {
  const res = await fetch(`${API_BASE}/assets/search?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchAssetDetail(id: number): Promise<AssetDetail> {
  const res = await fetch(`${API_BASE}/assets/${id}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function fetchPlaybackInfo(id: number): Promise<PlaybackInfo> {
  const res = await fetch(`${API_BASE}/assets/${id}/play`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function renameAsset(id: number, newRelativePath: string): Promise<void> {
  const res = await fetch(`${API_BASE}/assets/${id}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_relative_path: newRelativePath })
  });
  if (!res.ok) throw new Error('Failed to rename asset');
}

export async function deleteAsset(id: number, permanent = false): Promise<void> {
  const res = await fetch(`${API_BASE}/assets/${id}?permanent=${permanent}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete asset');
}

export async function addAssetTag(id: number, addTagIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/assets/${id}/tags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ add_tags: addTagIds, remove_tags: [] })
  });
  if (!res.ok) throw new Error('Failed to tag asset');
}

export async function fetchBrowseByKind(): Promise<{
  code: 'audio' | 'video' | 'image' | 'document' | 'other';
  description: string;
  asset_count: number;
  total_bytes: number;
}[]> {
  const res = await fetch(`${API_BASE}/browse/by-kind`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchCollections(): Promise<CollectionItem[]> {
  const res = await fetch(`${API_BASE}/collections`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchCollectionTree(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/collections/${id}/tree`);
  const json = await res.json();
  return json.data;
}

export async function createCollection(name: string, typeCode = 'folder', parentId = 0): Promise<number> {
  const res = await fetch(`${API_BASE}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type_code: typeCode, parent_id: parentId })
  });
  const json = await res.json();
  return json.data?.id;
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/tags`);
  const json = await res.json();
  return json.data || [];
}

export async function createTag(name: string, parentTagId: number | null = null): Promise<number> {
  const res = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_tag_id: parentTagId })
  });
  const json = await res.json();
  return json.data?.id;
}

export async function fetchDuplicates(): Promise<DuplicatePair[]> {
  const res = await fetch(`${API_BASE}/analyze/duplicates`);
  const json = await res.json();
  return json.data || [];
}

export async function resolveDuplicate(
  id: number,
  resolution: 'duplicate' | 'not_duplicate' | 'manual_override'
): Promise<void> {
  const res = await fetch(`${API_BASE}/analyze/duplicates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution })
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to resolve duplicate');
  }
}

export async function fetchLibraryStats(): Promise<LibraryStats> {
  const res = await fetch(`${API_BASE}/analyze/stats`);
  const json = await res.json();
  return json.data;
}

export async function fetchActivityLogs(limit = 50): Promise<ActivityLogItem[]> {
  const res = await fetch(`${API_BASE}/activity?limit=${limit}`);
  const json = await res.json();
  return json.data || [];
}

export async function triggerIngestScan(rootPath = '/media/library', dryRun = false): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/ingest/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storage_location_id: 1,
      root_path: rootPath,
      dry_run: dryRun
    })
  });
  const json = await res.json();
  return json.data;
}

export async function registerAsset(payload: {
  content_hash: string;
  hash_algorithm?: string;
  file_type_id: number;
  byte_size: number;
  storage_location_id?: number;
  relative_path: string;
}): Promise<number> {
  const res = await fetch(`${API_BASE}/ingest/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storage_location_id: 1,
      hash_algorithm: 'sha256',
      ...payload
    })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data?.id;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Additional helper functions & aliases for App integration
export async function fetchFileTypes(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/lookups/file-types`);
    const json = await res.json();
    return json.data || [];
  } catch {
    return [
      { id: 1, name: 'FLAC Audio', extension: 'flac', mime_type: 'audio/flac' },
      { id: 2, name: 'MP3 Audio', extension: 'mp3', mime_type: 'audio/mpeg' },
      { id: 3, name: 'WAV Audio', extension: 'wav', mime_type: 'audio/wav' },
      { id: 4, name: 'MP4 Video', extension: 'mp4', mime_type: 'video/mp4' },
      { id: 5, name: 'WebM Video', extension: 'webm', mime_type: 'video/webm' },
      { id: 6, name: 'JPEG Image', extension: 'jpg', mime_type: 'image/jpeg' },
      { id: 7, name: 'PNG Image', extension: 'png', mime_type: 'image/png' }
    ];
  }
}

export async function fetchMediaKinds(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/lookups/media-kinds`);
    const json = await res.json();
    return json.data || [];
  } catch {
    return [
      { code: 'audio', description: 'Audio files and lossless recordings' },
      { code: 'video', description: 'Video streams and footage' },
      { code: 'image', description: 'Photography, artwork, and scans' },
      { code: 'document', description: 'Text, PDFs, and documentation' }
    ];
  }
}

export async function fetchCollectionTypes(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/lookups/collection-types`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchRenditionTypes(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/lookups/rendition-types`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchStorageKinds(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/lookups/storage-kinds`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchCanonicalFields(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/lookups/canonical-fields`);
  const json = await res.json();
  return json.data || [];
}

export async function bulkDeleteAssets(ids: number[], permanent = false): Promise<any> {
  const res = await fetch(`${API_BASE}/assets/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_ids: ids, permanent })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to bulk delete assets');
  }
  return json.data;
}

// Aliases matching App imports
export const fetchStats = fetchLibraryStats;
export const fetchBrowseSummary = fetchBrowseByKind;
export const renameAssetPath = renameAsset;
export const resolveDuplicatePair = resolveDuplicate;
export const addTagToAsset = addAssetTag;
export const registerSingleAsset = registerAsset;

// Library Paths & Storage Mounts API
export async function fetchLibraryPaths(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/library-paths`);
  const json = await res.json();
  return json.data || [];
}

export async function addLibraryPath(name: string, dirPath: string, storage_kind = 'local', watch_enabled = true): Promise<any> {
  const res = await fetch(`${API_BASE}/library-paths`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, path: dirPath, storage_kind, watch_enabled })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to register library path');
  }
  return json.data;
}

export async function deleteLibraryPath(id: number): Promise<void> {
  await fetch(`${API_BASE}/library-paths/${id}`, { method: 'DELETE' });
}

export async function scanLibraryPath(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/library-paths/${id}/scan`, { method: 'POST' });
  const json = await res.json();
  return json.data;
}

export async function scanAllLibraryPaths(): Promise<any> {
  const res = await fetch(`${API_BASE}/library-paths/scan-all`, { method: 'POST' });
  const json = await res.json();
  return json.data;
}


