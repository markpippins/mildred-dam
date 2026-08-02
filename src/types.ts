/**
 * Mildred DAM — REST API TypeScript Interfaces & Data Types
 * Uniform Envelope & Core Models
 */

export type ThemeMode = 'light' | 'dark' | 'steel';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    page_size: number;
    next_cursor?: string;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  db?: string;
  timestamp?: string;
  latency_ms?: number;
}

export interface LookupItem {
  id: number;
  code?: string;
  name?: string;
  description?: string;
  extension?: string;
  mime_type?: string;
  media_kind_id?: number;
  is_binary?: boolean;
}

export interface MediaKind {
  id: number;
  code: 'audio' | 'video' | 'image' | 'document' | 'other';
  description: string;
}

export interface FileType {
  id: number;
  name: string;
  extension: string;
  mime_type?: string;
  media_kind_id?: number;
  is_binary?: boolean;
  description?: string;
}

export interface CollectionType {
  id: number;
  code: string;
  description: string;
}

export interface RenditionType {
  id: number;
  code: 'thumbnail' | 'waveform' | 'transcript' | 'preview' | 'waveform-large';
  description: string;
}

export interface StorageKind {
  id: number;
  code: string;
  description: string;
}

export interface CanonicalField {
  id: number;
  name: string;
  data_type: 'text' | 'float' | 'int' | 'date' | 'boolean';
  description: string;
}

export interface FileLocation {
  id: number;
  asset_id: number;
  storage_location_id: number;
  relative_path: string;
  is_primary: boolean;
  valid_from: string;
  valid_to: string | null;
}

export interface Tag {
  id: number;
  name: string;
  parent_tag_id?: number | null;
  aliases?: string[];
  children?: Tag[];
  description?: string;
}

export interface AssetMetadataItem {
  canonical_name: string;
  data_type: 'text' | 'float' | 'int' | 'date' | 'boolean';
  value: string;
}

export interface AssetSummary {
  id: number;
  content_hash: string;
  hash_algorithm: string;
  file_type_id: number;
  byte_size: number;
  first_seen_at: string;
  is_deleted: boolean;
  file_type: {
    id?: number;
    name: string;
    extension: string;
  };
  media_kind: {
    code: 'audio' | 'video' | 'image' | 'document' | 'other';
  };
  primary_path?: string;
  thumbnail_url?: string;
  waveform_url?: string;
  tags?: Tag[];
}

export interface AssetDetail extends AssetSummary {
  file_locations: FileLocation[];
  tags: Tag[];
  metadata: AssetMetadataItem[];
  version_number?: number;
}

export interface Rendition {
  id: number;
  rendition_type: string;
  relative_path: string;
  pixel_width: number | null;
  pixel_height: number | null;
  duration_seconds?: number | null;
}

export interface PlaybackInfo {
  asset_id: number;
  primary_path: string;
  storage_root: string;
  full_uri: string;
  mime_type: string;
  byte_size: number;
  renditions: Rendition[];
}

export interface BrowseByKindItem {
  code: 'audio' | 'video' | 'image' | 'document' | 'other';
  description: string;
  asset_count: number;
  total_bytes: number;
}

export interface CollectionItem {
  id: number;
  parent_collection_id: number;
  name: string;
  collection_type_id: number;
  collection_type: string;
  is_active: boolean;
  child_count: number;
  asset_count: number;
}

export interface CollectionTreeNode {
  id: number;
  name: string;
  collection_type: string;
  is_active: boolean;
  children: CollectionTreeNode[];
  asset_count?: number;
}

export interface DuplicatePair {
  id: number;
  asset_id: number;
  matched_asset_id: number;
  matcher_name: 'exact-content-hash' | 'acoustic-fingerprint' | 'perceptual-image-hash' | 'metadata-similarity';
  comparison_result: 'duplicate' | 'possible_duplicate' | 'not_duplicate' | 'manual_override';
  score: number;
  asset_path: string;
  matched_path: string;
  evaluated_at: string;
  asset_size?: number;
  matched_size?: number;
  asset_kind?: string;
}

export interface LibraryStats {
  total_assets: number;
  total_bytes: number;
  total_collections: number;
  total_tags: number;
  by_media_kind: Record<string, number>;
  duplicate_count: number;
  possible_duplicate_count: number;
  orphaned_assets: number;
}

export interface ActivityLogItem {
  id: number;
  occurred_at: string;
  action: 'ingested' | 'deleted' | 'renamed' | 'moved' | 'tagged' | 'duplicate_resolved' | 'collection_updated' | 'version_created';
  asset_id: number | null;
  asset_path: string | null;
  collection_id: number | null;
  collection_name: string | null;
  user_id: number | null;
  username: string | null;
  detail: string | null;
}

export interface SearchResultItem {
  asset: {
    id: number;
    content_hash: string;
    file_type_id: number;
    byte_size: number;
    first_seen_at: string;
    file_type: {
      name: string;
      extension: string;
    };
    media_kind: {
      code: 'audio' | 'video' | 'image' | 'document' | 'other';
    };
    file_locations: {
      relative_path: string;
      is_primary: boolean;
    }[];
  };
  score: number | null;
  match_on: string | null;
}

export interface ScanResult {
  files_scanned: number;
  new_assets: number;
  existing_assets: number;
  errors: string[];
  classified_by: Record<string, number>;
}

export interface LibraryPath {
  id: number;
  name: string;
  path: string;
  storage_kind: 'local' | 'nfs' | 's3' | 'other';
  status: 'active' | 'idle' | 'scanning' | 'error';
  last_scanned: string;
  file_count: number;
  total_bytes: number;
  watch_enabled: boolean;
}
