import React from 'react';
import {
  LayoutGrid,
  Search,
  BarChart3,
  Copy,
  FolderTree,
  History,
  HardDrive,
  Database,
  Radio,
  FolderOpen
} from 'lucide-react';
import { formatBytes } from '../services/api';

export type NavTab = 'dashboard' | 'discovery' | 'analytics' | 'duplicates' | 'collections' | 'catalog';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenActivityModal: () => void;
  onOpenLibraryModal?: () => void;
  totalBytesUsed?: number;
  healthStatus?: string;
  latencyMs?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenActivityModal,
  onOpenLibraryModal,
  totalBytesUsed = 795000000000,
  healthStatus = 'healthy',
  latencyMs = 24
}) => {
  // Assume 1 TB total storage quota for visual calculation
  const quotaBytes = 1000000000000;
  const percentUsed = Math.min(100, Math.round((totalBytesUsed / quotaBytes) * 100)) || 78;

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Bento Grid', icon: LayoutGrid },
    { id: 'discovery' as NavTab, label: 'Discovery & Library', icon: Search },
    { id: 'duplicates' as NavTab, label: 'Duplicate Intelligence', icon: Copy, badge: '4' },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'collections' as NavTab, label: 'Collections & Tags', icon: FolderTree }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col p-6 shrink-0 select-none">
      {/* Brand Header from Bento Grid theme */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white block leading-none">Mildred DAM</span>
          <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">AssetFlow Engine</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="space-y-1.5 flex-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mb-2">
          Management & Search
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'discovery' && activeTab === 'catalog');
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mb-2">
            System & Audit
          </div>
          {onOpenLibraryModal && (
            <button
              onClick={onOpenLibraryModal}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-xl transition-all"
            >
              <FolderOpen className="w-5 h-5 text-indigo-400" />
              <span>Library Management</span>
            </button>
          )}
          <button
            onClick={onOpenActivityModal}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-xl transition-all"
          >
            <History className="w-5 h-5 text-slate-500" />
            <span>Activity & Audit Log</span>
          </button>
        </div>
      </nav>

      {/* REST API Node Status Pill */}
      <div className="mb-4 px-3 py-2 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">API :3140</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
          {healthStatus} ({latencyMs}ms)
        </span>
      </div>

      {/* Storage Used Indicator from Bento Grid HTML */}
      <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-800/60">
        <div className="flex justify-between text-xs mb-2 text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            Storage Used
          </span>
          <span className="font-mono text-slate-200">{percentUsed}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-indigo-500 transition-all duration-700 rounded-full"
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{formatBytes(totalBytesUsed)}</span>
          <span>1.0 TB max</span>
        </div>
      </div>
    </aside>
  );
};
