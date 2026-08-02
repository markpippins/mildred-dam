import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// --- SEEDED IN-MEMORY DATABASE FOR MILDRED DAM REST API ---

let nextAssetId = 100;
let nextCollectionId = 20;
let nextTagId = 30;
let nextDuplicateId = 10;
let nextActivityId = 2000;

const LOOKUPS = {
  mediaKinds: [
    { id: 1, code: 'audio', description: 'Audio files' },
    { id: 2, code: 'video', description: 'Video files' },
    { id: 3, code: 'image', description: 'Image files' },
    { id: 4, code: 'document', description: 'Documents and text' },
    { id: 5, code: 'other', description: 'Unclassified' }
  ],
  fileTypes: [
    { id: 1, name: 'FLAC Audio', extension: '.flac', mime_type: 'audio/flac', media_kind_id: 1, is_binary: true, description: 'Free Lossless Audio Codec' },
    { id: 2, name: 'MP3 Audio', extension: '.mp3', mime_type: 'audio/mpeg', media_kind_id: 1, is_binary: true, description: 'MPEG Audio Layer III' },
    { id: 3, name: 'MP4 Video', extension: '.mp4', mime_type: 'video/mp4', media_kind_id: 2, is_binary: true, description: 'MPEG-4 Part 14 Video' },
    { id: 4, name: 'PRORES Video', extension: '.mov', mime_type: 'video/quicktime', media_kind_id: 2, is_binary: true, description: 'Apple ProRes Master' },
    { id: 5, name: 'JPEG Image', extension: '.jpg', mime_type: 'image/jpeg', media_kind_id: 3, is_binary: true, description: 'JPEG Still Image' },
    { id: 6, name: 'RAW Image', extension: '.arw', mime_type: 'image/x-sony-arw', media_kind_id: 3, is_binary: true, description: 'Sony RAW Image' },
    { id: 7, name: 'PDF Document', extension: '.pdf', mime_type: 'application/pdf', media_kind_id: 4, is_binary: true, description: 'Portable Document Format' },
    { id: 8, name: 'PNG Image', extension: '.png', mime_type: 'image/png', media_kind_id: 3, is_binary: true, description: 'Portable Network Graphics' }
  ],
  collectionTypes: [
    { id: 1, code: 'album', description: 'Music album' },
    { id: 2, code: 'artist', description: 'Performing artist' },
    { id: 3, code: 'genre', description: 'Musical genre' },
    { id: 4, code: 'series', description: 'Content campaign or series' },
    { id: 5, code: 'folder', description: 'Storage directory group' }
  ],
  renditionTypes: [
    { id: 1, code: 'thumbnail', description: 'Small preview image' },
    { id: 2, code: 'waveform', description: 'Audio waveform visualization' },
    { id: 3, code: 'transcript', description: 'Speech-to-text transcript' },
    { id: 4, code: 'preview', description: 'Web-optimized preview video/audio' }
  ],
  storageKinds: [
    { id: 1, code: 'local', description: 'Local filesystem (/media/library)' },
    { id: 2, code: 's3', description: 'Amazon S3 High-Speed Bucket' },
    { id: 3, code: 'nfs', description: 'Network File System Deep Archive' }
  ],
  canonicalFields: [
    { id: 1, name: 'artist', data_type: 'text', description: 'Primary performing artist or creator' },
    { id: 2, name: 'album', data_type: 'text', description: 'Album or collection title' },
    { id: 3, name: 'duration_seconds', data_type: 'float', description: 'Duration in seconds' },
    { id: 4, name: 'resolution', data_type: 'text', description: 'Pixel dimensions or aspect ratio' },
    { id: 5, name: 'codec', data_type: 'text', description: 'Encoding algorithm' },
    { id: 6, name: 'bitrate_kbps', data_type: 'int', description: 'Bitrate in kbps' }
  ]
};

const tags = [
  { id: 1, name: 'mood', aliases: [], children: [
    { id: 7, name: 'upbeat', parent_tag_id: 1, aliases: ['energetic', 'lively'], children: [] },
    { id: 8, name: 'melancholic', parent_tag_id: 1, aliases: ['calm', 'ambient'], children: [] }
  ]},
  { id: 2, name: 'project', aliases: [], children: [
    { id: 9, name: 'Q3-Launch', parent_tag_id: 2, aliases: ['campaign-2026'], children: [] },
    { id: 10, name: 'Brand-Refresh', parent_tag_id: 2, aliases: ['rebrand'], children: [] }
  ]},
  { id: 3, name: 'favorites', aliases: ['starred'], children: [] },
  { id: 4, name: 'master-copy', aliases: ['final'], children: [] },
  { id: 5, name: 'needs-review', aliases: [], children: [] }
];

const collections: any[] = [
  {
    id: 1,
    parent_collection_id: 0,
    name: 'Jazz Classics Archive',
    collection_type_id: 3,
    collection_type: 'genre',
    is_active: true,
    child_count: 2,
    asset_count: 14,
    children: [
      {
        id: 2,
        name: 'Miles Davis Master Tapes',
        collection_type: 'artist',
        is_active: true,
        children: [
          {
            id: 3,
            name: 'Kind of Blue (1959 192kHz Reissue)',
            collection_type: 'album',
            is_active: true,
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 4,
    parent_collection_id: 0,
    name: 'Q3 Product Marketing Campaign',
    collection_type_id: 4,
    collection_type: 'series',
    is_active: true,
    child_count: 0,
    asset_count: 28,
    children: []
  },
  {
    id: 5,
    parent_collection_id: 0,
    name: 'Brand Guideline Assets 2026',
    collection_type_id: 5,
    collection_type: 'folder',
    is_active: true,
    child_count: 0,
    asset_count: 9,
    children: []
  }
];

// Rich set of realistic seeded assets
let assets: any[] = [
  {
    id: 42,
    content_hash: 'd41d8cd98f00b204e9800998ecf8427e01',
    hash_algorithm: 'sha256',
    file_type_id: 1,
    byte_size: 48500120,
    first_seen_at: '2026-07-15T12:00:00Z',
    is_deleted: false,
    file_type: { id: 1, name: 'FLAC Audio', extension: '.flac' },
    media_kind: { code: 'audio' },
    file_locations: [
      { id: 88, asset_id: 42, storage_location_id: 1, relative_path: 'albums/jazz/miles_davis/so_what_master_192k.flac', is_primary: true, valid_from: '2026-07-15T12:00:00Z', valid_to: null }
    ],
    tags: [ { id: 3, name: 'favorites' }, { id: 4, name: 'master-copy' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Miles Davis' },
      { canonical_name: 'album', data_type: 'text', value: 'Kind of Blue' },
      { canonical_name: 'duration_seconds', data_type: 'float', value: '562.4' },
      { canonical_name: 'codec', data_type: 'text', value: 'FLAC 24-bit 192kHz' },
      { canonical_name: 'bitrate_kbps', data_type: 'int', value: '4608' }
    ]
  },
  {
    id: 43,
    content_hash: 'e82b7cd98f00b204e9800998ecf8427e02',
    hash_algorithm: 'sha256',
    file_type_id: 2,
    byte_size: 9850120,
    first_seen_at: '2026-07-16T14:10:00Z',
    is_deleted: false,
    file_type: { id: 2, name: 'MP3 Audio', extension: '.mp3' },
    media_kind: { code: 'audio' },
    file_locations: [
      { id: 89, asset_id: 43, storage_location_id: 1, relative_path: 'albums/jazz/miles_davis/so_what_web_320k.mp3', is_primary: true, valid_from: '2026-07-16T14:10:00Z', valid_to: null }
    ],
    tags: [ { id: 7, name: 'upbeat' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Miles Davis' },
      { canonical_name: 'album', data_type: 'text', value: 'Kind of Blue' },
      { canonical_name: 'duration_seconds', data_type: 'float', value: '562.4' },
      { canonical_name: 'codec', data_type: 'text', value: 'MP3 320kbps' }
    ]
  },
  {
    id: 44,
    content_hash: 'f93c8cd98f00b204e9800998ecf8427e03',
    hash_algorithm: 'sha256',
    file_type_id: 3,
    byte_size: 345000120,
    first_seen_at: '2026-07-18T09:30:00Z',
    is_deleted: false,
    file_type: { id: 3, name: 'MP4 Video', extension: '.mp4' },
    media_kind: { code: 'video' },
    file_locations: [
      { id: 90, asset_id: 44, storage_location_id: 1, relative_path: 'campaigns/q3_launch/product_demo_v2_4k_final.mp4', is_primary: true, valid_from: '2026-07-18T09:30:00Z', valid_to: null }
    ],
    tags: [ { id: 9, name: 'Q3-Launch' }, { id: 4, name: 'master-copy' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Mildred DAM Creative Team' },
      { canonical_name: 'duration_seconds', data_type: 'float', value: '142.0' },
      { canonical_name: 'resolution', data_type: 'text', value: '3840x2160 (4K UHD)' },
      { canonical_name: 'codec', data_type: 'text', value: 'H.264 High Profile' }
    ]
  },
  {
    id: 45,
    content_hash: 'f93c8cd98f00b204e9800998ecf8427e03',
    hash_algorithm: 'sha256',
    file_type_id: 3,
    byte_size: 345000120,
    first_seen_at: '2026-07-19T11:15:00Z',
    is_deleted: false,
    file_type: { id: 3, name: 'MP4 Video', extension: '.mp4' },
    media_kind: { code: 'video' },
    file_locations: [
      { id: 91, asset_id: 45, storage_location_id: 2, relative_path: 'backups/2026_marketing_sync/product_demo_v2_4k_final_copy.mp4', is_primary: true, valid_from: '2026-07-19T11:15:00Z', valid_to: null }
    ],
    tags: [ { id: 5, name: 'needs-review' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Mildred DAM Creative Team' },
      { canonical_name: 'duration_seconds', data_type: 'float', value: '142.0' },
      { canonical_name: 'resolution', data_type: 'text', value: '3840x2160 (4K UHD)' }
    ]
  },
  {
    id: 46,
    content_hash: 'a12b8cd98f00b204e9800998ecf8427e04',
    hash_algorithm: 'sha256',
    file_type_id: 5,
    byte_size: 6420100,
    first_seen_at: '2026-07-20T08:20:00Z',
    is_deleted: false,
    file_type: { id: 5, name: 'JPEG Image', extension: '.jpg' },
    media_kind: { code: 'image' },
    file_locations: [
      { id: 92, asset_id: 46, storage_location_id: 1, relative_path: 'photos/campaigns/hero_banner_mountain_sunset.jpg', is_primary: true, valid_from: '2026-07-20T08:20:00Z', valid_to: null }
    ],
    tags: [ { id: 3, name: 'favorites' }, { id: 10, name: 'Brand-Refresh' } ],
    metadata: [
      { canonical_name: 'resolution', data_type: 'text', value: '6000x4000 (24MP)' },
      { canonical_name: 'artist', data_type: 'text', value: 'Elena Rostova' }
    ]
  },
  {
    id: 47,
    content_hash: 'a12b8cd98f00b204e9800998ecf8427e04',
    hash_algorithm: 'sha256',
    file_type_id: 5,
    byte_size: 6420100,
    first_seen_at: '2026-07-21T16:00:00Z',
    is_deleted: false,
    file_type: { id: 5, name: 'JPEG Image', extension: '.jpg' },
    media_kind: { code: 'image' },
    file_locations: [
      { id: 93, asset_id: 47, storage_location_id: 1, relative_path: 'photos/campaigns/old_export/hero_banner_mountain_sunset_dup.jpg', is_primary: true, valid_from: '2026-07-21T16:00:00Z', valid_to: null }
    ],
    tags: [ { id: 5, name: 'needs-review' } ],
    metadata: [
      { canonical_name: 'resolution', data_type: 'text', value: '6000x4000 (24MP)' }
    ]
  },
  {
    id: 48,
    content_hash: 'b33c8cd98f00b204e9800998ecf8427e05',
    hash_algorithm: 'sha256',
    file_type_id: 7,
    byte_size: 14201000,
    first_seen_at: '2026-07-22T10:00:00Z',
    is_deleted: false,
    file_type: { id: 7, name: 'PDF Document', extension: '.pdf' },
    media_kind: { code: 'document' },
    file_locations: [
      { id: 94, asset_id: 48, storage_location_id: 1, relative_path: 'docs/branding/Mildred_DAM_Brand_Guidelines_2026_Edition.pdf', is_primary: true, valid_from: '2026-07-22T10:00:00Z', valid_to: null }
    ],
    tags: [ { id: 10, name: 'Brand-Refresh' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Design Systems Group' }
    ]
  },
  {
    id: 49,
    content_hash: 'c44d8cd98f00b204e9800998ecf8427e06',
    hash_algorithm: 'sha256',
    file_type_id: 1,
    byte_size: 51200100,
    first_seen_at: '2026-07-24T18:45:00Z',
    is_deleted: false,
    file_type: { id: 1, name: 'FLAC Audio', extension: '.flac' },
    media_kind: { code: 'audio' },
    file_locations: [
      { id: 95, asset_id: 49, storage_location_id: 1, relative_path: 'albums/jazz/miles_davis/blue_in_green_master.flac', is_primary: true, valid_from: '2026-07-24T18:45:00Z', valid_to: null }
    ],
    tags: [ { id: 3, name: 'favorites' }, { id: 8, name: 'melancholic' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Miles Davis' },
      { canonical_name: 'album', data_type: 'text', value: 'Kind of Blue' },
      { canonical_name: 'duration_seconds', data_type: 'float', value: '337.8' }
    ]
  },
  {
    id: 50,
    content_hash: 'd55e8cd98f00b204e9800998ecf8427e07',
    hash_algorithm: 'sha256',
    file_type_id: 6,
    byte_size: 89400200,
    first_seen_at: '2026-07-25T13:30:00Z',
    is_deleted: false,
    file_type: { id: 6, name: 'RAW Image', extension: '.arw' },
    media_kind: { code: 'image' },
    file_locations: [
      { id: 96, asset_id: 50, storage_location_id: 1, relative_path: 'raws/2026_shoots/campaign_shoot_day1_034.arw', is_primary: true, valid_from: '2026-07-25T13:30:00Z', valid_to: null }
    ],
    tags: [ { id: 9, name: 'Q3-Launch' } ],
    metadata: [
      { canonical_name: 'resolution', data_type: 'text', value: '8256x5504 (45MP)' },
      { canonical_name: 'artist', data_type: 'text', value: 'Elena Rostova' }
    ]
  },
  {
    id: 51,
    content_hash: 'e66f8cd98f00b204e9800998ecf8427e08',
    hash_algorithm: 'sha256',
    file_type_id: 4,
    byte_size: 1845000100,
    first_seen_at: '2026-07-26T15:10:00Z',
    is_deleted: false,
    file_type: { id: 4, name: 'PRORES Video', extension: '.mov' },
    media_kind: { code: 'video' },
    file_locations: [
      { id: 97, asset_id: 51, storage_location_id: 3, relative_path: 'archive/prores_masters/brand_anthem_2026_prores422.mov', is_primary: true, valid_from: '2026-07-26T15:10:00Z', valid_to: null }
    ],
    tags: [ { id: 4, name: 'master-copy' }, { id: 10, name: 'Brand-Refresh' } ],
    metadata: [
      { canonical_name: 'artist', data_type: 'text', value: 'Mildred DAM Creative Team' },
      { canonical_name: 'duration_seconds', data_type: 'float', value: '180.0' },
      { canonical_name: 'resolution', data_type: 'text', value: '4096x2160 (DCI 4K)' }
    ]
  }
];

let duplicatePairs: any[] = [
  {
    id: 1,
    asset_id: 44,
    matched_asset_id: 45,
    matcher_name: 'exact-content-hash',
    comparison_result: 'duplicate',
    score: 1.0,
    asset_path: 'campaigns/q3_launch/product_demo_v2_4k_final.mp4',
    matched_path: 'backups/2026_marketing_sync/product_demo_v2_4k_final_copy.mp4',
    evaluated_at: '2026-07-31T10:00:00Z',
    asset_size: 345000120,
    matched_size: 345000120,
    asset_kind: 'video'
  },
  {
    id: 2,
    asset_id: 46,
    matched_asset_id: 47,
    matcher_name: 'exact-content-hash',
    comparison_result: 'duplicate',
    score: 1.0,
    asset_path: 'photos/campaigns/hero_banner_mountain_sunset.jpg',
    matched_path: 'photos/campaigns/old_export/hero_banner_mountain_sunset_dup.jpg',
    evaluated_at: '2026-07-31T11:15:00Z',
    asset_size: 6420100,
    matched_size: 6420100,
    asset_kind: 'image'
  },
  {
    id: 3,
    asset_id: 42,
    matched_asset_id: 43,
    matcher_name: 'acoustic-fingerprint',
    comparison_result: 'possible_duplicate',
    score: 0.94,
    asset_path: 'albums/jazz/miles_davis/so_what_master_192k.flac',
    matched_path: 'albums/jazz/miles_davis/so_what_web_320k.mp3',
    evaluated_at: '2026-07-31T12:30:00Z',
    asset_size: 48500120,
    matched_size: 9850120,
    asset_kind: 'audio'
  },
  {
    id: 4,
    asset_id: 50,
    matched_asset_id: 46,
    matcher_name: 'perceptual-image-hash',
    comparison_result: 'possible_duplicate',
    score: 0.88,
    asset_path: 'raws/2026_shoots/campaign_shoot_day1_034.arw',
    matched_path: 'photos/campaigns/hero_banner_mountain_sunset.jpg',
    evaluated_at: '2026-07-31T13:00:00Z',
    asset_size: 89400200,
    matched_size: 6420100,
    asset_kind: 'image'
  }
];

let activityLogs: any[] = [
  { id: 101, occurred_at: '2026-07-31T18:45:00Z', action: 'ingested', asset_id: 51, asset_path: 'archive/prores_masters/brand_anthem_2026_prores422.mov', collection_id: 4, collection_name: 'Q3 Product Marketing Campaign', user_id: 1, username: 'mpippins', detail: 'Ingested DCI 4K ProRes Master via automated scan' },
  { id: 102, occurred_at: '2026-07-31T18:10:00Z', action: 'duplicate_resolved', asset_id: 44, asset_path: 'campaigns/q3_launch/product_demo_v2_4k_final.mp4', collection_id: null, collection_name: null, user_id: 1, username: 'mpippins', detail: 'Confirmed exact duplicate match with backup copy (Score 1.00)' },
  { id: 103, occurred_at: '2026-07-31T17:30:00Z', action: 'tagged', asset_id: 42, asset_path: 'albums/jazz/miles_davis/so_what_master_192k.flac', collection_id: 1, collection_name: 'Jazz Classics Archive', user_id: 1, username: 'mpippins', detail: 'Added tags: favorites, master-copy' },
  { id: 104, occurred_at: '2026-07-31T16:15:00Z', action: 'renamed', asset_id: 48, asset_path: 'docs/branding/Mildred_DAM_Brand_Guidelines_2026_Edition.pdf', collection_id: 5, collection_name: 'Brand Guideline Assets 2026', user_id: 1, username: 'mpippins', detail: 'Renamed from guideline_draft.pdf' },
  { id: 105, occurred_at: '2026-07-31T15:00:00Z', action: 'ingested', asset_id: 49, asset_path: 'albums/jazz/miles_davis/blue_in_green_master.flac', collection_id: 1, collection_name: 'Jazz Classics Archive', user_id: 1, username: 'mpippins', detail: 'Ingested lossless FLAC track' }
];

let nextLibraryPathId = 4;
let libraryPaths: any[] = [
  {
    id: 1,
    name: 'Primary Media Library',
    path: '/mnt/media/library',
    storage_kind: 'local',
    status: 'active',
    last_scanned: '2026-08-01T11:45:00Z',
    file_count: 4821,
    total_bytes: 142500000000,
    watch_enabled: true
  },
  {
    id: 2,
    name: 'Q3 Campaign Projects',
    path: '/srv/campaigns_2026',
    storage_kind: 'local',
    status: 'active',
    last_scanned: '2026-08-01T10:12:00Z',
    file_count: 2459,
    total_bytes: 243100000000,
    watch_enabled: true
  },
  {
    id: 3,
    name: 'Photo Archives & Scans',
    path: '/mnt/archive/photo_scans',
    storage_kind: 'nfs',
    status: 'idle',
    last_scanned: '2026-07-29T08:00:00Z',
    file_count: 8920,
    total_bytes: 410400000000,
    watch_enabled: false
  }
];

// Helper to wrap responses in Mildred DAM uniform envelope
function sendEnvelope(res: express.Response, data: any, meta?: any) {
  res.status(200).json({ data, meta });
}

function sendError(res: express.Response, status: number, error: string) {
  res.status(status).json({ error });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- HEALTH / PROBES ---
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      data: {
        status: 'healthy',
        db: 'in-memory-seeded',
        timestamp: new Date().toISOString(),
        latency_ms: Math.floor(Math.random() * 8) + 4
      }
    });
  });

  app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
  });

  // --- LOOKUPS ROUTE ---
  app.get('/api/lookups/media-kinds', (req, res) => sendEnvelope(res, LOOKUPS.mediaKinds));
  app.get('/api/lookups/file-types', (req, res) => sendEnvelope(res, LOOKUPS.fileTypes));
  app.get('/api/lookups/collection-types', (req, res) => sendEnvelope(res, LOOKUPS.collectionTypes));
  app.get('/api/lookups/rendition-types', (req, res) => sendEnvelope(res, LOOKUPS.renditionTypes));
  app.get('/api/lookups/storage-kinds', (req, res) => sendEnvelope(res, LOOKUPS.storageKinds));
  app.get('/api/lookups/canonical-fields', (req, res) => sendEnvelope(res, LOOKUPS.canonicalFields));

  // --- BROWSE BY KIND ---
  app.get('/api/browse/by-kind', (req, res) => {
    const counts = { audio: { count: 0, bytes: 0 }, video: { count: 0, bytes: 0 }, image: { count: 0, bytes: 0 }, document: { count: 0, bytes: 0 }, other: { count: 0, bytes: 0 } };
    assets.filter(a => !a.is_deleted).forEach(a => {
      const code = (a.media_kind.code || 'other') as keyof typeof counts;
      if (counts[code]) {
        counts[code].count += 1;
        counts[code].bytes += a.byte_size;
      }
    });
    const summary = [
      { code: 'audio', description: 'Audio files', asset_count: counts.audio.count, total_bytes: counts.audio.bytes },
      { code: 'video', description: 'Video files', asset_count: counts.video.count, total_bytes: counts.video.bytes },
      { code: 'image', description: 'Image files', asset_count: counts.image.count, total_bytes: counts.image.bytes },
      { code: 'document', description: 'Documents and text', asset_count: counts.document.count, total_bytes: counts.document.bytes },
      { code: 'other', description: 'Unclassified', asset_count: counts.other.count, total_bytes: counts.other.bytes }
    ];
    sendEnvelope(res, summary);
  });

  // --- ASSETS DISCOVERY & SEARCH ---
  app.get('/api/assets', (req, res) => {
    const { media_kind, file_type_id, is_deleted } = req.query;
    let result = assets;
    if (is_deleted === 'true' || is_deleted === '1') {
      result = result.filter(a => a.is_deleted);
    } else if (is_deleted === 'false' || is_deleted === '0') {
      result = result.filter(a => !a.is_deleted);
    } else {
      result = result.filter(a => !a.is_deleted); // default soft-deleted hidden
    }

    if (media_kind) {
      result = result.filter(a => a.media_kind.code === media_kind);
    }
    if (file_type_id) {
      result = result.filter(a => String(a.file_type_id) === String(file_type_id));
    }
    sendEnvelope(res, result.map(a => ({
      ...a,
      primary_path: a.file_locations?.[0]?.relative_path || 'unassigned'
    })));
  });

  app.get('/api/assets/search', (req, res) => {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return sendEnvelope(res, assets.filter(a => !a.is_deleted).map(a => ({
        asset: a,
        score: 1.0,
        match_on: 'default_list'
      })));
    }
    const matches = assets.filter(a => !a.is_deleted).map(a => {
      const pathStr = a.file_locations?.[0]?.relative_path?.toLowerCase() || '';
      const tagStr = (a.tags || []).map((t: any) => t.name.toLowerCase()).join(' ');
      const metaStr = (a.metadata || []).map((m: any) => m.value.toLowerCase()).join(' ');
      if (pathStr.includes(q)) return { asset: a, score: 0.98, match_on: 'path' };
      if (tagStr.includes(q)) return { asset: a, score: 0.95, match_on: 'tag' };
      if (metaStr.includes(q)) return { asset: a, score: 0.90, match_on: 'metadata' };
      return null;
    }).filter(Boolean);

    sendEnvelope(res, matches);
  });

  // --- ASSET DETAIL, DELETE, PLAYBACK, RENAME, MOVE ---
  app.get('/api/assets/:id/play', (req, res) => {
    const id = Number(req.params.id);
    const asset = assets.find(a => a.id === id);
    if (!asset) return sendError(res, 404, 'asset not found or has no active location');
    const primaryPath = asset.file_locations?.[0]?.relative_path || 'unknown';
    const mime = LOOKUPS.fileTypes.find(f => f.id === asset.file_type_id)?.mime_type || 'application/octet-stream';
    sendEnvelope(res, {
      asset_id: id,
      primary_path: primaryPath,
      storage_root: '/media/library',
      full_uri: `/media/library/${primaryPath}`,
      mime_type: mime,
      byte_size: asset.byte_size,
      renditions: [
        { id: 104, rendition_type: 'thumbnail', relative_path: `thumbs/${id}_thumb.jpg`, pixel_width: 300, pixel_height: 300 },
        { id: 105, rendition_type: 'waveform', relative_path: `waves/${id}_wave.png`, pixel_width: 800, pixel_height: 180 }
      ]
    });
  });

  app.get('/api/assets/:id', (req, res) => {
    const id = Number(req.params.id);
    const asset = assets.find(a => a.id === id);
    if (!asset) return sendError(res, 404, 'asset not found');
    sendEnvelope(res, asset);
  });

  app.delete('/api/assets/:id', (req, res) => {
    const id = Number(req.params.id);
    const permanent = req.query.permanent === 'true';
    const idx = assets.findIndex(a => a.id === id);
    if (idx === -1) return sendError(res, 404, 'asset not found');
    if (permanent) {
      assets.splice(idx, 1);
    } else {
      assets[idx].is_deleted = true;
    }
    activityLogs.unshift({
      id: nextActivityId++,
      occurred_at: new Date().toISOString(),
      action: 'deleted',
      asset_id: id,
      asset_path: assets[idx]?.file_locations?.[0]?.relative_path || 'deleted_path',
      collection_id: null,
      collection_name: null,
      user_id: 1,
      username: 'mpippins',
      detail: permanent ? 'Hard deleted asset permanently' : 'Soft deleted asset'
    });
    sendEnvelope(res, { status: 'deleted' });
  });

  app.post('/api/assets/bulk-delete', (req, res) => {
    const { asset_ids = [], permanent = false } = req.body || {};
    let succeeded = 0;
    const errors: any[] = [];
    asset_ids.forEach((id: number) => {
      const idx = assets.findIndex(a => a.id === id);
      if (idx !== -1) {
        if (permanent) assets.splice(idx, 1);
        else assets[idx].is_deleted = true;
        succeeded++;
      } else {
        errors.push({ asset_id: id, error: 'asset not found' });
      }
    });
    sendEnvelope(res, { succeeded, failed: errors.length, errors });
  });

  app.put('/api/assets/:id/rename', (req, res) => {
    const id = Number(req.params.id);
    const { new_relative_path } = req.body || {};
    const asset = assets.find(a => a.id === id);
    if (!asset || !asset.file_locations?.[0]) return sendError(res, 404, 'asset not found or has no active primary location');
    const oldPath = asset.file_locations[0].relative_path;
    asset.file_locations[0].relative_path = new_relative_path;
    activityLogs.unshift({
      id: nextActivityId++,
      occurred_at: new Date().toISOString(),
      action: 'renamed',
      asset_id: id,
      asset_path: new_relative_path,
      collection_id: null,
      collection_name: null,
      user_id: 1,
      username: 'mpippins',
      detail: `Renamed from ${oldPath}`
    });
    sendEnvelope(res, { status: 'renamed' });
  });

  app.put('/api/assets/:id/tags', (req, res) => {
    const id = Number(req.params.id);
    const { add_tags = [], remove_tags = [] } = req.body || {};
    const asset = assets.find(a => a.id === id);
    if (!asset) return sendError(res, 404, 'asset not found');
    
    // Add new tag references
    add_tags.forEach((tagId: number) => {
      if (!asset.tags.some((t: any) => t.id === tagId)) {
        const foundTag = tags.flatMap(t => [t, ...(t.children || [])]).find(t => t.id === tagId);
        if (foundTag) asset.tags.push({ id: foundTag.id, name: foundTag.name });
      }
    });
    // Remove tag references
    asset.tags = asset.tags.filter((t: any) => !remove_tags.includes(t.id));
    sendEnvelope(res, { status: 'ok', tags: asset.tags });
  });

  // --- COLLECTIONS & TAGS ---
  app.get('/api/collections', (req, res) => sendEnvelope(res, collections));
  app.post('/api/collections', (req, res) => {
    const { parent_id = 0, name, type_code = 'folder' } = req.body || {};
    const newCol = {
      id: nextCollectionId++,
      parent_collection_id: parent_id,
      name,
      collection_type_id: LOOKUPS.collectionTypes.find(c => c.code === type_code)?.id || 5,
      collection_type: type_code,
      is_active: true,
      child_count: 0,
      asset_count: 0,
      children: []
    };
    collections.push(newCol);
    sendEnvelope(res, { id: newCol.id });
  });

  app.get('/api/collections/:id/tree', (req, res) => {
    const id = Number(req.params.id);
    const col = collections.find(c => c.id === id) || collections[0];
    sendEnvelope(res, col);
  });

  app.get('/api/tags', (req, res) => sendEnvelope(res, tags));
  app.post('/api/tags', (req, res) => {
    const { name, parent_tag_id = null, description } = req.body || {};
    const newTag = { id: nextTagId++, name, parent_tag_id, aliases: [], children: [], description };
    if (parent_tag_id) {
      const parent = tags.find(t => t.id === parent_tag_id);
      if (parent) parent.children.push(newTag);
      else tags.push(newTag);
    } else {
      tags.push(newTag);
    }
    sendEnvelope(res, { id: newTag.id });
  });

  // --- DUPLICATES & STATS ---
  app.get('/api/analyze/duplicates', (req, res) => {
    sendEnvelope(res, duplicatePairs);
  });

  app.put('/api/analyze/duplicates/:id', (req, res) => {
    const id = Number(req.params.id);
    const { resolution } = req.body || {};
    if (!['duplicate', 'not_duplicate', 'manual_override'].includes(resolution)) {
      return sendError(res, 400, 'resolution must be duplicate, not_duplicate, or manual_override');
    }
    const dup = duplicatePairs.find(d => d.id === id);
    if (!dup) return sendError(res, 404, 'duplicate match not found');
    dup.comparison_result = resolution;
    activityLogs.unshift({
      id: nextActivityId++,
      occurred_at: new Date().toISOString(),
      action: 'duplicate_resolved',
      asset_id: dup.asset_id,
      asset_path: dup.asset_path,
      collection_id: null,
      collection_name: null,
      user_id: 1,
      username: 'mpippins',
      detail: `Resolved duplicate pair #${id} as: ${resolution}`
    });
    sendEnvelope(res, { status: 'resolved', resolution });
  });

  app.get('/api/analyze/stats', (req, res) => {
    const activeAssets = assets.filter(a => !a.is_deleted);
    const totalBytes = activeAssets.reduce((sum, a) => sum + a.byte_size, 0);
    const byMedia: Record<string, number> = { audio: 0, video: 0, image: 0, document: 0, other: 0 };
    activeAssets.forEach(a => {
      const k = a.media_kind.code || 'other';
      byMedia[k] = (byMedia[k] || 0) + 1;
    });
    const dupCount = duplicatePairs.filter(d => d.comparison_result === 'duplicate').length;
    const possCount = duplicatePairs.filter(d => d.comparison_result === 'possible_duplicate').length;
    sendEnvelope(res, {
      total_assets: activeAssets.length,
      total_bytes: totalBytes,
      total_collections: collections.length,
      total_tags: tags.length,
      by_media_kind: byMedia,
      duplicate_count: dupCount,
      possible_duplicate_count: possCount,
      orphaned_assets: 2
    });
  });

  // --- AUDIT ACTIVITY LOGS ---
  app.get('/api/activity', (req, res) => {
    const limit = Number(req.query.limit) || 50;
    sendEnvelope(res, activityLogs.slice(0, limit));
  });

  // --- INGEST & SCAN ENGINE ---
  app.post('/api/ingest/scan', (req, res) => {
    const { storage_location_id = 1, root_path = '/media/library', dry_run = false } = req.body || {};
    
    // Simulate finding 5 new files during scan
    const simulatedNewFiles = [
      { name: 'coltrane_giant_steps_96k.flac', typeId: 1, ext: '.flac', kind: 'audio', size: 41200000 },
      { name: 'product_teaser_v3_social.mp4', typeId: 3, ext: '.mp4', kind: 'video', size: 112000000 },
      { name: 'brand_palette_swatches_2026.pdf', typeId: 7, ext: '.pdf', kind: 'document', size: 3400000 },
      { name: 'press_kit_hero_photo_01.jpg', typeId: 5, ext: '.jpg', kind: 'image', size: 5800000 },
      { name: 'press_kit_hero_photo_02.jpg', typeId: 5, ext: '.jpg', kind: 'image', size: 6100000 }
    ];

    if (!dry_run) {
      simulatedNewFiles.forEach((file, idx) => {
        const newAssetId = nextAssetId++;
        const newAsset = {
          id: newAssetId,
          content_hash: `scan_${Date.now()}_${idx}`,
          hash_algorithm: 'sha256',
          file_type_id: file.typeId,
          byte_size: file.size,
          first_seen_at: new Date().toISOString(),
          is_deleted: false,
          file_type: { id: file.typeId, name: `${file.ext.toUpperCase().slice(1)} File`, extension: file.ext },
          media_kind: { code: file.kind },
          file_locations: [
            {
              id: nextAssetId + 100,
              asset_id: newAssetId,
              storage_location_id: storage_location_id,
              relative_path: `scanned_ingest/${file.name}`,
              is_primary: true,
              valid_from: new Date().toISOString(),
              valid_to: null
            }
          ],
          tags: [ { id: 1, name: 'mood' } ],
          metadata: [
            { canonical_name: 'artist', data_type: 'text', value: 'Auto Scanned Library' }
          ]
        };
        assets.unshift(newAsset);
        activityLogs.unshift({
          id: nextActivityId++,
          occurred_at: new Date().toISOString(),
          action: 'ingested',
          asset_id: newAssetId,
          asset_path: `scanned_ingest/${file.name}`,
          collection_id: null,
          collection_name: null,
          user_id: 1,
          username: 'mpippins',
          detail: `Automatic Ingest Scanner registration from ${root_path}`
        });
      });
    }

    res.status(202).json({
      data: {
        files_scanned: 1528,
        new_assets: simulatedNewFiles.length,
        existing_assets: 1523,
        errors: [],
        classified_by: {
          '*.flac': 420,
          '*.mp3': 280,
          '*.mp4': 190,
          '*.jpg': 480,
          '*.pdf': 158
        }
      }
    });
  });

  // --- LIBRARY PATHS & WATCH FOLDERS ---
  app.get('/api/library-paths', (req, res) => {
    sendEnvelope(res, libraryPaths);
  });

  app.post('/api/library-paths', (req, res) => {
    const { name, path: dirPath, storage_kind = 'local', watch_enabled = true } = req.body || {};
    if (!dirPath || typeof dirPath !== 'string' || !dirPath.trim()) {
      return sendError(res, 400, 'Directory path is required.');
    }
    const trimmedPath = dirPath.trim();
    if (
      trimmedPath.toLowerCase().includes('fail') ||
      trimmedPath.toLowerCase().includes('error') ||
      trimmedPath.toLowerCase().includes('invalid') ||
      trimmedPath.toLowerCase().includes('unreachable')
    ) {
      return sendError(res, 400, `Directory path unreachable: Permission denied (errno 13 - EACCES) or mount point "${trimmedPath}" disconnected. Please verify filesystem access rights and ownership.`);
    }
    if (
      !trimmedPath.startsWith('/') &&
      !trimmedPath.startsWith('s3://') &&
      !trimmedPath.startsWith('nfs://') &&
      !trimmedPath.startsWith('smb://') &&
      !trimmedPath.startsWith('C:\\') &&
      !trimmedPath.startsWith('D:\\') &&
      !trimmedPath.startsWith('\\\\')
    ) {
      return sendError(res, 400, `Invalid path URI format "${trimmedPath}": Absolute filesystem path (e.g., /mnt/media) or cloud scheme (s3://, nfs://) is required.`);
    }
    const newPath = {
      id: nextLibraryPathId++,
      name: name || trimmedPath.split('/').pop() || trimmedPath,
      path: trimmedPath,
      storage_kind,
      status: 'active',
      last_scanned: new Date().toISOString(),
      file_count: Math.floor(Math.random() * 400) + 120,
      total_bytes: Math.floor(Math.random() * 80000000000) + 5000000000,
      watch_enabled: Boolean(watch_enabled)
    };
    libraryPaths.push(newPath);

    const sampleAssetId = nextAssetId++;
    assets.unshift({
      id: sampleAssetId,
      content_hash: 'c8f2a1b9e0349f8a12bc4431e21b77889a0f',
      hash_algorithm: 'sha256',
      file_type_id: 1,
      byte_size: 42100000,
      first_seen_at: new Date().toISOString(),
      is_deleted: false,
      file_type: { id: 1, name: 'FLAC Audio', extension: '.flac' },
      media_kind: { code: 'audio' },
      file_locations: [
        {
          id: sampleAssetId + 100,
          asset_id: sampleAssetId,
          storage_location_id: newPath.id,
          relative_path: `${dirPath}/new_import_track_01.flac`,
          is_primary: true,
          valid_from: new Date().toISOString(),
          valid_to: null
        }
      ],
      tags: [{ id: 3, name: 'favorites' }],
      metadata: [
        { canonical_name: 'artist', data_type: 'text', value: 'New Library Import' },
        { canonical_name: 'album', data_type: 'text', value: dirPath.split('/').pop() || 'Imported Vault' }
      ]
    });

    activityLogs.unshift({
      id: nextActivityId++,
      occurred_at: new Date().toISOString(),
      action: 'ingested',
      asset_id: null,
      asset_path: dirPath,
      collection_id: null,
      collection_name: null,
      user_id: 1,
      username: 'mpippins',
      detail: `Mounted new library path ${dirPath} (${storage_kind.toUpperCase()})`
    });

    sendEnvelope(res, newPath);
  });

  app.delete('/api/library-paths/:id', (req, res) => {
    const id = Number(req.params.id);
    libraryPaths = libraryPaths.filter(p => p.id !== id);
    sendEnvelope(res, { deleted: true });
  });

  app.post('/api/library-paths/scan-all', (req, res) => {
    let totalScanned = 0;
    let totalNewIndexed = 0;
    const now = new Date().toISOString();
    libraryPaths.forEach(p => {
      p.last_scanned = now;
      const added = Math.floor(Math.random() * 12) + 2;
      p.file_count += added;
      totalScanned += p.file_count;
      totalNewIndexed += added;
    });
    res.status(200).json({
      data: {
        paths_scanned: libraryPaths.length,
        files_scanned: totalScanned,
        new_assets_indexed: totalNewIndexed,
        status: 'completed',
        scanned_at: now
      }
    });
  });

  app.post('/api/library-paths/:id/scan', (req, res) => {
    const id = Number(req.params.id);
    const target = libraryPaths.find(p => p.id === id);
    if (target) {
      target.last_scanned = new Date().toISOString();
      target.file_count += Math.floor(Math.random() * 15) + 3;
    }
    res.status(200).json({
      data: {
        files_scanned: target?.file_count || 100,
        new_assets_indexed: 5,
        status: 'completed'
      }
    });
  });

  app.post('/api/ingest/register', (req, res) => {
    const { content_hash, hash_algorithm = 'sha256', file_type_id, byte_size, storage_location_id = 1, relative_path } = req.body || {};
    if (!content_hash || !file_type_id || !byte_size || !relative_path) {
      return sendError(res, 400, 'invalid request body: content_hash, file_type_id, byte_size, and relative_path are required');
    }
    const ext = path.extname(relative_path) || '.dat';
    const typeObj = LOOKUPS.fileTypes.find(f => f.id === Number(file_type_id)) || LOOKUPS.fileTypes[0];
    const kindCode = LOOKUPS.mediaKinds.find(m => m.id === typeObj.media_kind_id)?.code || 'other';

    const newId = nextAssetId++;
    const newAsset = {
      id: newId,
      content_hash,
      hash_algorithm,
      file_type_id: Number(file_type_id),
      byte_size: Number(byte_size),
      first_seen_at: new Date().toISOString(),
      is_deleted: false,
      file_type: { id: typeObj.id, name: typeObj.name, extension: typeObj.extension },
      media_kind: { code: kindCode },
      file_locations: [
        {
          id: nextAssetId + 100,
          asset_id: newId,
          storage_location_id: Number(storage_location_id),
          relative_path,
          is_primary: true,
          valid_from: new Date().toISOString(),
          valid_to: null
        }
      ],
      tags: [],
      metadata: [
        { canonical_name: 'artist', data_type: 'text', value: 'Manual Ingest Upload' }
      ]
    };
    assets.unshift(newAsset);
    activityLogs.unshift({
      id: nextActivityId++,
      occurred_at: new Date().toISOString(),
      action: 'ingested',
      asset_id: newId,
      asset_path: relative_path,
      collection_id: null,
      collection_name: null,
      user_id: 1,
      username: 'mpippins',
      detail: `Registered single asset (SHA256: ${content_hash.slice(0, 8)}...)`
    });
    res.status(201).json({ data: { id: newId } });
  });

  // --- VITE MIDDLEWARE FOR SPA ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mildred DAM REST API + Bento Grid Dashboard running on http://localhost:${PORT}`);
  });
}

startServer();
