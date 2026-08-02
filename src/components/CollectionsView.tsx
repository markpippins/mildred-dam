import React, { useState } from 'react';
import {
  FolderTree,
  FolderPlus,
  Tag as TagIcon,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  Disc,
  User,
  Music,
  Layers,
  Sparkles
} from 'lucide-react';
import { CollectionItem, Tag } from '../types';

interface CollectionsViewProps {
  collections: CollectionItem[];
  tags: Tag[];
  onCreateCollection: (name: string, typeCode: string, parentId?: number) => Promise<void>;
  onCreateTag: (name: string, parentId?: number | null) => Promise<void>;
  isLoading: boolean;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  tags,
  onCreateCollection,
  onCreateTag,
  isLoading
}) => {
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('genre');
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingCol, setIsCreatingCol] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleCreateCol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    setIsCreatingCol(true);
    try {
      await onCreateCollection(newColName.trim(), newColType, 0);
      setNewColName('');
    } catch (err) {
      alert('Failed to create collection');
    } finally {
      setIsCreatingCol(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setIsCreatingTag(true);
    try {
      await onCreateTag(newTagName.trim(), null);
      setNewTagName('');
    } catch (err) {
      alert('Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const getColIcon = (typeCode: string) => {
    switch (typeCode) {
      case 'album': return <Disc className="w-4 h-4 text-indigo-400" />;
      case 'artist': return <User className="w-4 h-4 text-emerald-400" />;
      case 'genre': return <Music className="w-4 h-4 text-amber-400" />;
      case 'series': return <Layers className="w-4 h-4 text-pink-400" />;
      default: return <Folder className="w-4 h-4 text-slate-400" />;
    }
  };

  const renderTagNode = (tag: Tag, depth = 0) => {
    return (
      <div key={tag.id} className="space-y-1" style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center justify-between p-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm text-slate-200">#{tag.name}</span>
            {tag.aliases && tag.aliases.length > 0 && (
              <span className="text-[11px] text-slate-500 font-mono">
                aliases: {tag.aliases.join(', ')}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">ID #{tag.id}</span>
        </div>
        {tag.children && tag.children.length > 0 && (
          <div className="space-y-1">
            {tag.children.map(child => renderTagNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderColNode = (col: any, depth = 0) => {
    return (
      <div key={col.id} className="space-y-1" style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all">
          <div className="flex items-center gap-3">
            {getColIcon(col.collection_type)}
            <div>
              <span className="font-semibold text-sm text-slate-200 block">{col.name}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                {col.collection_type} • {col.asset_count || 0} assets
              </span>
            </div>
          </div>
          <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
            ID #{col.id}
          </span>
        </div>
        {col.children && col.children.length > 0 && (
          <div className="space-y-1">
            {col.children.map((child: any) => renderColNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-y-auto pr-1">
      {/* Left Column: Collections Hierarchy */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white tracking-tight">Collection Hierarchy</h3>
            </div>
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold uppercase">
              GET /api/collections
            </span>
          </div>

          {/* New Collection Form */}
          <form onSubmit={handleCreateCol} className="flex flex-wrap gap-2 mb-6 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <input
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="New collection name..."
              className="flex-1 min-w-[160px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newColType}
              onChange={(e) => setNewColType(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="genre">Genre</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
              <option value="series">Series</option>
              <option value="folder">Folder</option>
            </select>
            <button
              type="submit"
              disabled={isCreatingCol || !newColName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create Collection</span>
            </button>
          </form>

          {/* Collections List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading collections tree...</div>
            ) : collections.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No collections defined yet. Create one above.</div>
            ) : (
              collections.map(col => renderColNode(col))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Tags & Vocabularies */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white tracking-tight">Controlled Tag Vocabularies</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold uppercase">
              GET /api/tags
            </span>
          </div>

          {/* New Tag Form */}
          <form onSubmit={handleCreateTag} className="flex gap-2 mb-6 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name (e.g. archived, hi-res)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isCreatingTag || !newTagName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tag</span>
            </button>
          </form>

          {/* Tags List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading vocabulary tree...</div>
            ) : tags.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No tags defined yet.</div>
            ) : (
              tags.map(tag => renderTagNode(tag))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
