import React from 'react';
import {
  Search,
  Upload,
  RefreshCw,
  Activity,
  Database,
  Cpu,
  CheckCircle2,
  History,
  ShieldCheck,
  Radio,
  FolderPlus,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { LibraryStats, ThemeMode } from '../types';

interface HeaderProps {
  activeTab?: string;
  title?: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedKind?: string;
  onSelectKind?: (kind: string) => void;
  onOpenIngestModal: () => void;
  onOpenLibraryModal?: () => void;
  onOpenAuditModal?: () => void;
  onExportLogs?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  stats?: LibraryStats | null;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'dashboard',
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  selectedKind,
  onSelectKind,
  onOpenIngestModal,
  onOpenLibraryModal,
  onOpenAuditModal,
  onExportLogs,
  onRefresh,
  isRefreshing = false,
  stats,
  theme = 'dark',
  onThemeChange
}) => {
  // Dynamically resolve titles if not explicitly provided
  const getPageHeader = () => {
    if (title) return { title, description: subtitle || '' };
    switch (activeTab) {
      case 'discovery':
      case 'catalog':
        return {
          title: 'Discovery & Library Catalog',
          description: 'Explore, filter, play, and tag media assets across the library filesystem'
        };
      case 'duplicates':
        return {
          title: 'Duplicate Intelligence & Recovery',
          description: 'SHA-256 exact hash detection & perceptual audio/image similarity scoring'
        };
      case 'analytics':
        return {
          title: 'Library Footprint & Analytics',
          description: 'Storage distribution by MIME type, capacity metrics, and growth history'
        };
      case 'collections':
        return {
          title: 'Collections & Controlled Vocabulary',
          description: 'Manage hierarchical folders, music albums, campaigns, and tag hierarchies'
        };
      case 'dashboard':
      default:
        return {
          title: 'Mildred DAM • AssetFlow Engine',
          description: 'Real-time multimedia digital asset management & automated deduplication pipeline'
        };
    }
  };

  const { title: pageTitle, description: pageDesc } = getPageHeader();

  return (
    <header className="flex flex-col gap-4 mb-6 shrink-0 border-b border-slate-800/80 pb-5 bg-slate-900/60 px-6 pt-5 rounded-b-2xl">
      {/* Top row: Title and Quick Tools */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{pageTitle}</h1>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase font-bold tracking-wider rounded-md shadow-sm">
              v26.7 PRO
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{pageDesc}</p>
        </div>

        {/* Right Tools Area: Global Search, Upload, Refresh */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Global Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search path, tag, artist, album..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Theme Switcher Segmented Control */}
          {onThemeChange && (
            <div
              className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner gap-1"
              role="group"
              aria-label="Theme selection"
            >
              <button
                onClick={() => onThemeChange('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => onThemeChange('steel')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'steel'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Steel Theme"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Steel</span>
              </button>
            </div>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Library Metrics"
              disabled={isRefreshing}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}

          {onOpenLibraryModal && (
            <button
              onClick={onOpenLibraryModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>Library Management</span>
            </button>
          )}

          <button
            onClick={onOpenIngestModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>+ Upload / Scan</span>
          </button>
        </div>
      </div>

      {/* Styled System Status & Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
        {/* Left indicators: status LED, DB node, API health */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold tracking-wider">SYSTEM STATUS: OPTIMAL</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>DB Node: <strong className="text-slate-200">In-Memory Seeded (REST :3000)</strong></span>
          </div>

          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Worker Pool: <strong className="text-slate-200">8 / 8 Threads Ready</strong></span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crawl: <strong className="text-slate-300">4m ago (0 errors)</strong></span>
          </div>
        </div>

        {/* Right side telemetry info */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHA-256 Integrity Check Active</span>
          </div>

          {onOpenAuditModal && (
            <button
              onClick={onOpenAuditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors border border-slate-700/60 font-medium"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Activity Log</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

