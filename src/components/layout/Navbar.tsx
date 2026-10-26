import React, { useRef, useState } from 'react';
import {
  Compass,
  BookOpen,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  CheckCircle2,
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
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { Arc } from '../ui/LoadingIndicators';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
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
      className="h-12 border-b px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-20 relative text-[#EAEDED] transition-colors duration-150 rounded-none font-sans"
    >
      {/* Hidden File Input for JSON Backup Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: Branding & Sidebar Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 rounded-[4px] hover:bg-[#354150] text-[#879596] hover:text-[#EAEDED] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
          title={isSidebarOpen ? 'Hide service catalog' : 'Show service catalog'}
          aria-label={isSidebarOpen ? 'Hide service catalog' : 'Show service catalog'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-[#FF9900] flex items-center justify-center text-[#0F141A]">
            <Compass className="w-4 h-4" strokeWidth={2.25} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[14px] leading-[20px] text-[#EAEDED] tracking-tight">
              AWS Compass
            </span>
            <span className="text-[11px] text-[#879596] hidden md:inline">
              Architecture &amp; Study
            </span>
          </div>
        </div>
      </div>

      {/* Center: Command Palette Trigger & Workspace Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between gap-2 px-2.5 h-8 w-52 sm:w-72 text-[12px] text-[#879596] hover:text-[#EAEDED] bg-[#0F141A]/90 hover:bg-[#161E2D] border border-[#354150] hover:border-[#FF9900] rounded-[4px] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer group"
          title="Open command palette (Ctrl+K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-[#FF9900] shrink-0" strokeWidth={1.75} />
            <span className="truncate hidden sm:inline">Search docs, CLI &amp; blueprints...</span>
            <span className="truncate sm:hidden">Search docs...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#879596] bg-[#161E2D] border border-[#354150] rounded-[3px] shrink-0">
            Ctrl+K
          </kbd>
        </button>

        {/* Workspace Mode Tabs with #FF9900 bottom indicator */}
        <div className="flex items-center h-8 bg-[#0F141A] border border-[#354150] rounded-[4px] p-0.5">
          <button
            type="button"
            onClick={() => setWorkspaceMode('vault')}
            style={
              workspaceMode === 'vault'
                ? {
                    backgroundColor: 'var(--aws-brand)',
                    color: '#0F141A',
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 h-7 text-[12px] rounded-[3px] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer font-medium ${
              workspaceMode === 'vault'
                ? 'font-bold'
                : 'text-[#879596] hover:text-[#EAEDED] hover:bg-[#161E2D]'
            }`}
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Concept vault</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('canvas')}
            style={
              workspaceMode === 'canvas'
                ? {
                    backgroundColor: 'var(--aws-brand)',
                    color: '#0F141A',
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 h-7 text-[12px] rounded-[3px] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer font-medium ${
              workspaceMode === 'canvas'
                ? 'font-bold'
                : 'text-[#879596] hover:text-[#EAEDED] hover:bg-[#161E2D]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Architecture canvas</span>
          </button>
        </div>
      </div>

      {/* Right: Theme Toggle, Study Stats & Actions */}
      <div className="flex items-center gap-2">
        {/* Light / Dark Mode Toggle with better-ui 2-icon grid cross-fade */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 h-8 text-[12px] rounded-[4px] bg-[#0F141A] border border-[#354150] hover:border-[#FF9900] text-[#EAEDED] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme mode"
        >
          <span className="grid place-items-center w-4 h-4 shrink-0" aria-hidden="true">
            <span
              className={`[grid-area:1/1] transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px] ${
                theme === 'dark'
                  ? 'scale-100 opacity-100 blur-[0px]'
                  : 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none'
              }`}
            >
              <Sun className="w-4 h-4 text-[#FF9900]" strokeWidth={1.75} />
            </span>
            <span
              className={`[grid-area:1/1] transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-[0px] ${
                theme === 'dark'
                  ? 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none'
                  : 'scale-100 opacity-100 blur-[0px]'
              }`}
            >
              <Moon className="w-4 h-4 text-[#539FE5]" strokeWidth={1.75} />
            </span>
          </span>
          <span className="hidden sm:inline text-[12px] font-medium">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Study Progress Counts */}
        <div className="hidden lg:flex items-center gap-2 text-[12px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#0F141A] border border-[#354150] text-[#EAEDED]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1D8102]" strokeWidth={2} />
            <span>{masteredCount} mastered</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#0F141A] border border-[#354150] text-[#EAEDED]">
            <span className="w-2 h-2 rounded-full bg-[#539FE5]" />
            <span>{inProgressCount} in progress</span>
          </span>
        </div>

        {/* Backup Actions */}
        <div className="flex items-center h-8 bg-[#0F141A] border border-[#354150] rounded-[4px] p-0.5">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            aria-disabled={isExporting ? 'true' : undefined}
            className="flex items-center gap-1.5 px-2 h-7 text-[12px] rounded-[3px] text-[#879596] hover:text-[#EAEDED] hover:bg-[#161E2D] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
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
            className="flex items-center gap-1.5 px-2 h-7 text-[12px] rounded-[3px] text-[#879596] hover:text-[#EAEDED] hover:bg-[#161E2D] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
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

        {/* Reset to Seed Defaults */}
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 h-8 w-8 flex items-center justify-center rounded-[4px] bg-[#0F141A] border border-[#354150] text-[#879596] hover:text-[#DD344C] hover:border-[#DD344C] enabled:active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out cursor-pointer"
          title="Reset catalog and dossiers to initial seed"
          aria-label="Reset database to seed defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div
          style={{
            backgroundColor: '#0F141A',
            borderColor: '#1D8102',
            color: '#EAEDED',
          }}
          className="absolute bottom-[-38px] left-1/2 -translate-x-1/2 border text-[12px] px-3 py-1 rounded-[4px] shadow-lg flex items-center gap-2 z-50 animate-in fade-in duration-150"
        >
          <Check className="w-3.5 h-3.5 text-[#1D8102]" strokeWidth={2} />
          <span>{notificationMsg}</span>
        </div>
      )}
    </header>
  );
};

export default Navbar;
