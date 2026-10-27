import React, { useRef, useState } from 'react';
import {
  BookOpen,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Download,
  Upload,
  Search,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { exportFullDatabase, importFullDatabase } from '../../db/compassDb';
import { AWSCompassLogo } from '../icons/AWSCompassLogo';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { Arc } from '../ui/LoadingIndicators';

export interface TopNavbarProps {
  onOpenCommandPalette?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenCommandPalette }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const {
    workspaceMode,
    setWorkspaceMode,
    isSidebarOpen,
    toggleSidebar,
    services,
    resetToDefaults,
    refreshServices,
    theme,
    toggleTheme,
  } = useCompassStore();

  const { refreshSavedDiagrams } = useCanvasStore();

  const masteredCount = services.filter((s) => s.studyStatus === 'mastered').length;
  const inProgressCount = services.filter((s) => s.studyStatus === 'in-progress').length;
  const totalServices = services.length || 30;

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleReset = async () => {
    if (window.confirm('Reset service catalog and dossiers to initial seed defaults?')) {
      await resetToDefaults();
      showNotification('Catalog reset to initial seed defaults');
    }
  };

  // Full Dexie.js JSON Database Export
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportFullDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aws-compass-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotification('Database backup exported successfully (.json)');
    } catch (err) {
      alert('Failed to export database backup: ' + (err as Error).message);
    } finally {
      setTimeout(() => setIsExporting(false), 300);
    }
  };

  // Full Dexie.js JSON Database Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importFullDatabase(text);
      await refreshServices();
      await refreshSavedDiagrams();
      showNotification(
        `Imported ${result.servicesCount} services & ${result.diagramsCount} diagrams successfully!`
      );
    } catch (err) {
      alert('Failed to import backup: ' + (err as Error).message);
    } finally {
      e.target.value = '';
      setTimeout(() => setIsImporting(false), 300);
    }
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--aws-header-bg)',
        borderBottomColor: '#354150',
      }}
      className="h-12 border-b px-3 flex items-center justify-between shrink-0 select-none z-20 relative text-[#EAEDED] rounded-none font-sans"
    >
      {/* Hidden File Input for JSON Backup Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ZONE 1 (Left Zone): Brand & Flush Full-Height Workspace Tabs */}
      <div className="flex items-center h-full gap-2">
        {/* Sidebar Toggle: Borderless ghost icon button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-[#EAEDED] hover:bg-white/5 enabled:active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer"
          title={isSidebarOpen ? 'Hide service catalog' : 'Show service catalog'}
          aria-label={isSidebarOpen ? 'Hide service catalog' : 'Show service catalog'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>

        {/* Brand Identity */}
        <div className="flex items-center gap-2 pl-0.5 pr-2">
          <AWSCompassLogo size={24} />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[14px] leading-none text-white tracking-tight">
              AWS Compass
            </span>
          </div>
        </div>

        {/* 1px Vertical Divider */}
        <div className="h-5 w-px bg-[#354150] shrink-0" aria-hidden="true" />

        {/* Flush Console Mode Tabs (Full-height h-12) */}
        <nav className="flex items-center h-full" aria-label="Console Workspace Mode">
          <button
            type="button"
            onClick={() => setWorkspaceMode('vault')}
            className={`relative h-12 px-3.5 flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer select-none ${
              workspaceMode === 'vault'
                ? 'text-white font-semibold bg-white/[0.04]'
                : 'text-[#879596] hover:text-[#EAEDED] hover:bg-white/[0.03]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Concept vault</span>
            {workspaceMode === 'vault' && (
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] bg-[#FF9900]"
                aria-hidden="true"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('canvas')}
            className={`relative h-12 px-3.5 flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer select-none ${
              workspaceMode === 'canvas'
                ? 'text-white font-semibold bg-white/[0.04]'
                : 'text-[#879596] hover:text-[#EAEDED] hover:bg-white/[0.03]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Architecture canvas</span>
            {workspaceMode === 'canvas' && (
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] bg-[#FF9900]"
                aria-hidden="true"
              />
            )}
          </button>
        </nav>
      </div>

      {/* ZONE 2 (Center Zone): Recessed Command Palette Trigger (Ctrl+K) */}
      <div className="flex-1 max-w-sm mx-4 hidden md:flex justify-center">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="h-8 w-80 rounded-[6px] bg-[#090D12]/80 border border-[#354150] hover:border-[#545B64] px-3 flex items-center justify-between text-[13px] text-[#879596] hover:text-[#EAEDED] transition-colors cursor-pointer group"
          title="Open command palette (Ctrl+K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#879596] group-hover:text-[#EAEDED] shrink-0" strokeWidth={1.75} />
            <span className="truncate">Search services, CLI, blueprints...</span>
          </div>
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#879596] bg-[#161E2D] border border-[#354150] rounded-[3px] shrink-0">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* ZONE 3 (Right Zone): Unified Telemetry Readout & Borderless Utility Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Icon Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-[#EAEDED] hover:bg-white/5 cursor-pointer"
          title="Open search"
        >
          <Search className="w-4 h-4" strokeWidth={1.75} />
        </button>

        {/* Unified Study Progress Pill */}
        <div
          className="hidden sm:flex items-center gap-2.5 px-2.5 py-1 rounded-[6px] hover:bg-white/5 cursor-default transition-colors"
          title={`${masteredCount} mastered, ${inProgressCount} in progress (${totalServices} total services)`}
        >
          {/* 48px wide, 6px tall segmented mini progress bar */}
          <div className="w-12 h-1.5 rounded-full bg-[#232F3E] overflow-hidden flex shrink-0">
            <div
              style={{
                width: `${(masteredCount / totalServices) * 100}%`,
              }}
              className="h-full bg-[#1D8102] transition-[width] duration-300"
            />
            <div
              style={{
                width: `${(inProgressCount / totalServices) * 100}%`,
              }}
              className="h-full bg-[#539FE5] transition-[width] duration-300"
            />
          </div>

          <span className="text-[12px] tabular-nums font-mono flex items-center gap-0.5">
            <span className="text-[#2EA043] font-semibold">{masteredCount}</span>
            <span className="text-[#879596]">/</span>
            <span className="text-[#539FE5] font-semibold">{inProgressCount}</span>
            <span className="text-[12px] text-[#879596] ml-1 font-sans">studied</span>
          </span>
        </div>

        {/* 1px Vertical Divider */}
        <div className="h-4 w-px bg-[#354150] shrink-0 hidden sm:block" aria-hidden="true" />

        {/* Borderless Ghost Buttons: Export & Import */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            aria-disabled={isExporting ? 'true' : undefined}
            className="h-8 px-2.5 rounded-[6px] text-[12px] font-medium text-[#879596] hover:text-white hover:bg-white/8 transition-colors flex items-center gap-1.5 cursor-pointer enabled:active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export full database backup (.json)"
          >
            <AnimatedIcon
              activeKey={isExporting ? 'loading' : 'idle'}
              size={14}
              className="w-3.5 h-3.5"
            >
              <Download key="idle" className="w-3.5 h-3.5" strokeWidth={1.75} />
              <Arc key="loading" size={14} easing="stacked" cap="round" color="#EAEDED" />
            </AnimatedIcon>
            <span className="hidden xl:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            aria-disabled={isImporting ? 'true' : undefined}
            className="h-8 px-2.5 rounded-[6px] text-[12px] font-medium text-[#879596] hover:text-white hover:bg-white/8 transition-colors flex items-center gap-1.5 cursor-pointer enabled:active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Import database backup (.json)"
          >
            <AnimatedIcon
              activeKey={isImporting ? 'loading' : 'idle'}
              size={14}
              className="w-3.5 h-3.5"
            >
              <Upload key="idle" className="w-3.5 h-3.5" strokeWidth={1.75} />
              <Arc key="loading" size={14} easing="stacked" cap="round" color="#EAEDED" />
            </AnimatedIcon>
            <span className="hidden xl:inline">Import</span>
          </button>
        </div>

        {/* Borderless Icon Buttons: Theme Toggle & Reset */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-white hover:bg-white/8 cursor-pointer enabled:active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme mode"
          >
            <AnimatedIcon
              activeKey={theme}
              size={16}
              className="w-4 h-4"
            >
              <Sun key="dark" className="w-4 h-4 text-[#FF9900]" strokeWidth={1.75} />
              <Moon key="light" className="w-4 h-4 text-[#539FE5]" strokeWidth={1.75} />
            </AnimatedIcon>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-[#DD344C] hover:bg-white/8 cursor-pointer enabled:active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out"
            title="Reset catalog and dossiers to initial seed"
            aria-label="Reset database to seed defaults"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div
          style={{
            backgroundColor: '#0F141A',
            borderColor: '#1D8102',
            color: '#EAEDED',
          }}
          className="absolute bottom-[-38px] left-1/2 -translate-x-1/2 border text-[12px] px-3 py-1 rounded-[6px] shadow-lg flex items-center gap-2 z-50 animate-in fade-in duration-150"
        >
          <Check className="w-3.5 h-3.5 text-[#1D8102]" strokeWidth={2} />
          <span>{notificationMsg}</span>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
