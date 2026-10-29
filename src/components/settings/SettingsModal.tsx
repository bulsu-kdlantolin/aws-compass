import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Palette,
  LayoutGrid,
  Globe,
  Database,
  Keyboard,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useSettingsStore, type SettingsTab, type ThemePreference, type UIDensity, type CodeFontSize, type CanvasGridVariant, type SnapGridSize, type DefaultEdgeStyle, type InspectorDockPosition, type AWSRegion, type StudyTierFilter } from '../../store/useSettingsStore';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { db, exportFullDatabase, importFullDatabase, resetDatabaseToDefaults } from '../../db/compassDb';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  const activeSettingsTab = useSettingsStore((s) => s.activeSettingsTab);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const openSettings = useSettingsStore((s) => s.openSettings);

  const theme = useSettingsStore((s) => s.theme);
  const uiDensity = useSettingsStore((s) => s.uiDensity);
  const defaultStudyTierFilter = useSettingsStore((s) => s.defaultStudyTierFilter);
  const codeFontSize = useSettingsStore((s) => s.codeFontSize);
  const canvasGridVariant = useSettingsStore((s) => s.canvasGridVariant);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const snapGridSize = useSettingsStore((s) => s.snapGridSize);
  const defaultEdgeStyle = useSettingsStore((s) => s.defaultEdgeStyle);
  const animateEdgesByDefault = useSettingsStore((s) => s.animateEdgesByDefault);
  const showMiniMap = useSettingsStore((s) => s.showMiniMap);
  const inspectorDockPosition = useSettingsStore((s) => s.inspectorDockPosition);
  const defaultAwsRegion = useSettingsStore((s) => s.defaultAwsRegion);
  const autoExpandMermaid = useSettingsStore((s) => s.autoExpandMermaid);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setUiDensity = useSettingsStore((s) => s.setUiDensity);
  const setDefaultStudyTierFilter = useSettingsStore((s) => s.setDefaultStudyTierFilter);
  const setCodeFontSize = useSettingsStore((s) => s.setCodeFontSize);
  const setCanvasGridVariant = useSettingsStore((s) => s.setCanvasGridVariant);
  const setSnapToGrid = useSettingsStore((s) => s.setSnapToGrid);
  const setSnapGridSize = useSettingsStore((s) => s.setSnapGridSize);
  const setDefaultEdgeStyle = useSettingsStore((s) => s.setDefaultEdgeStyle);
  const setAnimateEdgesByDefault = useSettingsStore((s) => s.setAnimateEdgesByDefault);
  const setShowMiniMap = useSettingsStore((s) => s.setShowMiniMap);
  const setInspectorDockPosition = useSettingsStore((s) => s.setInspectorDockPosition);
  const setDefaultAwsRegion = useSettingsStore((s) => s.setDefaultAwsRegion);
  const setAutoExpandMermaid = useSettingsStore((s) => s.setAutoExpandMermaid);

  const refreshServices = useCompassStore((s) => s.refreshServices);
  const refreshSavedDiagrams = useCanvasStore((s) => s.refreshSavedDiagrams);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database stats state
  const [stats, setStats] = useState<{
    totalServices: number;
    mastered: number;
    inProgress: number;
    customBlueprints: number;
  }>({ totalServices: 0, mastered: 0, inProgress: 0, customBlueprints: 0 });

  // Two-step destructive confirmation states
  const [resetStudyConfirm, setResetStudyConfirm] = useState(false);
  const [factoryResetConfirm, setFactoryResetConfirm] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Load live DB stats when opening the data tab
  useEffect(() => {
    if (!isSettingsOpen) {
      setResetStudyConfirm(false);
      setFactoryResetConfirm(false);
      setActionSuccessMsg(null);
      return;
    }

    const loadStats = async () => {
      try {
        const services = await db.services.toArray();
        const diagrams = await db.diagrams.toArray();
        const customBlueprints = diagrams.filter((d) => d.id !== 'active-canvas-diagram').length;
        const mastered = services.filter((s) => s.studyStatus === 'mastered').length;
        const inProgress = services.filter((s) => s.studyStatus === 'in-progress').length;

        setStats({
          totalServices: services.length,
          mastered,
          inProgress,
          customBlueprints,
        });
      } catch {
        // Ignore stats fetch error
      }
    };

    loadStats();
  }, [isSettingsOpen, activeSettingsTab]);

  // Global ESC listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleExportBackup = async () => {
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
      showSuccess('Workspace exported successfully (.json)');
    } catch (err) {
      alert('Failed to export workspace: ' + (err as Error).message);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importFullDatabase(text);
      await refreshServices();
      await refreshSavedDiagrams();
      showSuccess(`Imported ${result.servicesCount} services & ${result.diagramsCount} blueprints!`);
    } catch (err) {
      alert('Failed to import backup: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const handleResetStudyProgress = async () => {
    try {
      await db.transaction('rw', db.services, async () => {
        const services = await db.services.toArray();
        for (const s of services) {
          await db.services.update(s.id, {
            studyStatus: 'not-started',
            updatedAt: Date.now(),
          });
        }
      });
      await refreshServices();
      setResetStudyConfirm(false);
      showSuccess('Study mastery progress reset to not started');
    } catch (err) {
      alert('Failed to reset study progress: ' + (err as Error).message);
    }
  };

  const handleFactoryReset = async () => {
    try {
      await resetDatabaseToDefaults();
      await refreshServices();
      await refreshSavedDiagrams();
      setFactoryResetConfirm(false);
      showSuccess('Database restored to original factory defaults');
    } catch (err) {
      alert('Failed to factory reset: ' + (err as Error).message);
    }
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'Appearance & density', icon: <Palette className="w-4 h-4" /> },
    { id: 'canvas', label: 'Architecture canvas', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'study', label: 'Study & region defaults', icon: <Globe className="w-4 h-4" /> },
    { id: 'data', label: 'Data, backup & reset', icon: <Database className="w-4 h-4" /> },
    { id: 'shortcuts', label: 'Keyboard shortcuts', icon: <Keyboard className="w-4 h-4" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div
        style={{
          backgroundColor: 'var(--aws-card-bg)',
          borderColor: 'var(--aws-border)',
        }}
        className="max-w-[780px] w-[calc(100vw-2rem)] h-[540px] rounded-[16px] overflow-hidden flex border shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-150 select-none text-[var(--aws-text-primary)]"
      >
        {/* Left Navigation Rail (w-52) */}
        <aside
          style={{
            backgroundColor: 'var(--aws-page-bg)',
            borderRightColor: 'var(--aws-border)',
          }}
          className="w-52 border-r p-3 flex flex-col justify-between shrink-0"
        >
          <div className="space-y-1">
            <div className="px-2.5 py-1.5 text-[11px] font-bold text-[var(--aws-text-muted)] uppercase tracking-wider">
              Settings
            </div>
            {TABS.map((tab) => {
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openSettings(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer text-left ${isActive
                      ? 'bg-[var(--aws-card-bg)] text-[var(--aws-interactive)] font-semibold shadow-xs border border-[var(--aws-border)]'
                      : 'text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-card-bg)]/50 border border-transparent'
                    }`}
                >
                  <span className={isActive ? 'text-[var(--aws-interactive)]' : 'text-[var(--aws-text-muted)]'}>
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-2.5 py-2 text-[10px] text-[var(--aws-text-muted)] border-t border-[var(--aws-border)]">
            AWS Compass v1.0
          </div>
        </aside>

        {/* Right Settings Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[var(--aws-card-bg)]">
          {/* Header */}
          <div
            style={{ borderBottomColor: 'var(--aws-border)' }}
            className="h-12 px-5 border-b flex items-center justify-between shrink-0"
          >
            <h2 id="settings-dialog-title" className="text-[14px] font-bold text-[var(--aws-text-primary)]">
              {TABS.find((t) => t.id === activeSettingsTab)?.label}
            </h2>
            <button
              type="button"
              onClick={closeSettings}
              className="p-1 rounded-[6px] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)] hover:bg-[var(--aws-page-bg)] transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6 text-[13px]">
            {actionSuccessMsg && (
              <div className="p-3 rounded-[8px] bg-[#1D8102]/10 border border-[#1D8102]/30 text-[#1D8102] flex items-center gap-2 font-medium text-[12px]">
                <Check className="w-4 h-4 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: APPEARANCE & DENSITY */}
            {activeSettingsTab === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Mode */}
                <div>
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Theme mode
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Select a color scheme for the application workspace.
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-w-sm">
                    {[
                      { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-[#ED7100]" /> },
                      { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4 text-[#539FE5]" /> },
                      { id: 'system', label: 'System', icon: <Laptop className="w-4 h-4 text-[var(--aws-text-muted)]" /> },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTheme(m.id as ThemePreference)}
                        className={`h-9 px-3 rounded-[6px] border flex items-center justify-center gap-2 text-[12px] font-medium transition-all cursor-pointer ${theme === m.id
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold shadow-xs'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* UI Density */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Workspace density
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Controls row heights and spacing across the Concept Vault resource table and sidebar catalog.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    {[
                      { id: 'comfortable', label: 'Comfortable', desc: 'Relaxed row height' },
                      { id: 'compact', label: 'Compact', desc: 'High-density rows' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setUiDensity(d.id as UIDensity)}
                        className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer ${uiDensity === d.id
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold shadow-xs'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        <div className="font-semibold text-[12px]">{d.label}</div>
                        <div className="text-[10px] text-[var(--aws-text-muted)]">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Font Size */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Monospace code font size
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Font scale for CLI commands and ARN specification blocks.
                  </p>
                  <div className="flex items-center gap-2">
                    {(['12px', '13px', '14px'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setCodeFontSize(sz as CodeFontSize)}
                        className={`px-3 py-1.5 rounded-[6px] border text-[12px] font-mono cursor-pointer transition-colors ${codeFontSize === sz
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ARCHITECTURE CANVAS */}
            {activeSettingsTab === 'canvas' && (
              <div className="space-y-6">
                {/* Canvas Grid Style */}
                <div>
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Background grid style
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Visual guide pattern rendered across the canvas background.
                  </p>
                  <div className="grid grid-cols-4 gap-2 max-w-sm">
                    {[
                      { id: 'dots', label: 'Dots' },
                      { id: 'lines', label: 'Lines' },
                      { id: 'cross', label: 'Cross' },
                      { id: 'none', label: 'None' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setCanvasGridVariant(g.id as CanvasGridVariant)}
                        className={`h-8 px-2 rounded-[6px] border text-[12px] capitalize transition-all cursor-pointer text-center ${canvasGridVariant === g.id
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snap to Grid & Size */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="rounded border-[var(--aws-border)] text-[var(--aws-interactive)] focus:ring-0"
                    />
                    <span className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                      Snap nodes to alignment grid
                    </span>
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mt-1 ml-5 mb-2.5">
                    Automatically aligns nodes and group boundaries during drag operations.
                  </p>

                  {snapToGrid && (
                    <div className="ml-5 flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-[var(--aws-text-muted)] font-medium">Grid step size:</span>
                      {([16, 24, 32] as const).map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setSnapGridSize(step as SnapGridSize)}
                          className={`px-2.5 py-1 rounded-[4px] border font-mono text-[11px] cursor-pointer ${snapGridSize === step
                              ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                              : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)]'
                            }`}
                        >
                          {step}px
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Default Edge Style & Animation */}
                <div className="border-t border-[var(--aws-border)] pt-5 space-y-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                      Default connection routing
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-w-xs">
                      {[
                        { id: 'smoothstep', label: 'Smooth step' },
                        { id: 'bezier', label: 'Curved bezier' },
                        { id: 'straight', label: 'Straight' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setDefaultEdgeStyle(style.id as DefaultEdgeStyle)}
                          className={`h-8 px-2 rounded-[6px] border text-[11px] cursor-pointer text-center ${defaultEdgeStyle === style.id
                              ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                              : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                            }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
                    <input
                      type="checkbox"
                      checked={animateEdgesByDefault}
                      onChange={(e) => setAnimateEdgesByDefault(e.target.checked)}
                      className="rounded border-[var(--aws-border)] text-[var(--aws-interactive)] focus:ring-0"
                    />
                    <span className="text-[12px] font-medium text-[var(--aws-text-primary)]">
                      Animate edge traffic by default
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showMiniMap}
                      onChange={(e) => setShowMiniMap(e.target.checked)}
                      className="rounded border-[var(--aws-border)] text-[var(--aws-interactive)] focus:ring-0"
                    />
                    <span className="text-[12px] font-medium text-[var(--aws-text-primary)]">
                      Show canvas minimap
                    </span>
                  </label>
                </div>

                {/* Inspector Dock Position */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Split-Panel dock position
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Default dock edge for the dual-tab Sandbox Inspector.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    {[
                      { id: 'right', label: 'Right sidebar' },
                      { id: 'bottom', label: 'Bottom panel' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setInspectorDockPosition(pos.id as InspectorDockPosition)}
                        className={`h-8 px-2 rounded-[6px] border text-[11px] cursor-pointer text-center ${inspectorDockPosition === pos.id
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STUDY & REGION DEFAULTS */}
            {activeSettingsTab === 'study' && (
              <div className="space-y-6">
                {/* Default Region */}
                <div>
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Default AWS Region
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Target region reflected across ARN specification examples and regional boundary tags.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm">
                    {[
                      { id: 'us-east-1', name: 'US East (N. Virginia)' },
                      { id: 'us-west-2', name: 'US West (Oregon)' },
                      { id: 'eu-west-1', name: 'Europe (Ireland)' },
                      { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setDefaultAwsRegion(r.id as AWSRegion)}
                        className={`p-2.5 rounded-[6px] border text-left cursor-pointer transition-all ${defaultAwsRegion === r.id
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        <div className="font-mono text-[11px]">{r.id}</div>
                        <div className="text-[10px] text-[var(--aws-text-muted)] truncate">{r.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Tier Filter */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <label className="block text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Default exam tier filter
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-2.5">
                    Pre-selects an exam tier filter when launching the service catalog.
                  </p>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'all', label: 'All tiers' },
                      { id: 1, label: 'Tier 1' },
                      { id: 2, label: 'Tier 2' },
                      { id: 3, label: 'Tier 3' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDefaultStudyTierFilter(t.id as StudyTierFilter)}
                        className={`px-3 py-1.5 rounded-[6px] border text-[11px] cursor-pointer ${defaultStudyTierFilter === t.id
                            ? 'border-[var(--aws-interactive)] bg-[var(--aws-interactive)]/10 text-[var(--aws-interactive)] font-semibold'
                            : 'border-[var(--aws-border)] bg-[var(--aws-page-bg)] text-[var(--aws-text-muted)] hover:text-[var(--aws-text-primary)]'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-expand Mermaid */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoExpandMermaid}
                      onChange={(e) => setAutoExpandMermaid(e.target.checked)}
                      className="rounded border-[var(--aws-border)] text-[var(--aws-interactive)] focus:ring-0"
                    />
                    <span className="text-[12px] font-medium text-[var(--aws-text-primary)]">
                      Auto-expand architectural flowcharts
                    </span>
                  </label>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mt-1 ml-5">
                    Automatically renders full-height Mermaid enterprise diagrams inside concept dossiers.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: DATA, BACKUP & RESET */}
            {activeSettingsTab === 'data' && (
              <div className="space-y-6">
                {/* Database Statistics */}
                <div>
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)] mb-2.5">
                    Local IndexedDB telemetry
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 p-3 rounded-[8px] bg-[var(--aws-page-bg)] border border-[var(--aws-border)] text-center font-mono">
                    <div>
                      <div className="text-[16px] font-bold text-[var(--aws-text-primary)]">{stats.totalServices}</div>
                      <div className="text-[10px] text-[var(--aws-text-muted)] font-sans">Total services</div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[#1D8102]">{stats.mastered}</div>
                      <div className="text-[10px] text-[var(--aws-text-muted)] font-sans">Mastered</div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[#0972D3] dark:text-[#539FE5]">{stats.inProgress}</div>
                      <div className="text-[10px] text-[var(--aws-text-muted)] font-sans">In Progress</div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[#FF9900]">{stats.customBlueprints}</div>
                      <div className="text-[10px] text-[var(--aws-text-muted)] font-sans">Blueprints</div>
                    </div>
                  </div>
                </div>

                {/* Backup & Restore */}
                <div className="border-t border-[var(--aws-border)] pt-5">
                  <div className="text-[12px] font-bold text-[var(--aws-text-primary)] mb-1">
                    Workspace backup &amp; portable migration
                  </div>
                  <p className="text-[11px] text-[var(--aws-text-muted)] mb-3">
                    Export your custom notes, blueprints, and study statuses as a portable JSON file, or restore from a previously exported file.
                  </p>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="px-3 py-2 rounded-[6px] border border-[var(--aws-border)] hover:border-[var(--aws-interactive)] text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#FF9900]" />
                      <span>Export workspace (.json)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-[6px] border border-[var(--aws-border)] hover:border-[var(--aws-interactive)] text-[var(--aws-text-primary)] bg-[var(--aws-card-bg)] hover:bg-[var(--aws-page-bg)] flex items-center gap-1.5 text-[12px] font-medium transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#539FE5]" />
                      <span>Import workspace (.json)</span>
                    </button>
                  </div>
                </div>

                {/* Destructive Actions with 2-Step Safety Confirmation */}
                <div className="border-t border-[var(--aws-border)] pt-5 space-y-4">
                  <div className="text-[12px] font-bold text-[#DD344C] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Danger zone</span>
                  </div>

                  {/* Reset Study Progress */}
                  <div className="p-3 rounded-[8px] border border-[var(--aws-border)] bg-[var(--aws-page-bg)] flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[12px] font-semibold text-[var(--aws-text-primary)]">
                        Reset study mastery progress
                      </div>
                      <div className="text-[11px] text-[var(--aws-text-muted)]">
                        Sets all services back to Not Started. Custom blueprints and notes are preserved.
                      </div>
                    </div>
                    {resetStudyConfirm ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setResetStudyConfirm(false)}
                          className="px-2.5 py-1 text-[11px] rounded border border-[var(--aws-border)] text-[var(--aws-text-muted)] hover:bg-[var(--aws-card-bg)] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleResetStudyProgress}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#DD344C] text-white hover:opacity-90 cursor-pointer"
                        >
                          Confirm reset
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResetStudyConfirm(true)}
                        className="px-3 py-1.5 text-[11px] font-medium rounded border border-[#DD344C]/40 text-[#DD344C] hover:bg-[#DD344C]/10 cursor-pointer shrink-0"
                      >
                        Reset progress
                      </button>
                    )}
                  </div>

                  {/* Factory Reset Database */}
                  <div className="p-3 rounded-[8px] border border-[#DD344C]/30 bg-[#DD344C]/5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[12px] font-semibold text-[#DD344C]">
                        Factory reset database
                      </div>
                      <div className="text-[11px] text-[var(--aws-text-muted)]">
                        Wipes all custom changes and restores initial seed services and reference blueprints.
                      </div>
                    </div>
                    {factoryResetConfirm ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setFactoryResetConfirm(false)}
                          className="px-2.5 py-1 text-[11px] rounded border border-[var(--aws-border)] text-[var(--aws-text-muted)] hover:bg-[var(--aws-card-bg)] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleFactoryReset}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#DD344C] text-white hover:opacity-90 cursor-pointer"
                        >
                          Confirm factory reset
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFactoryResetConfirm(true)}
                        className="px-3 py-1.5 text-[11px] font-bold rounded bg-[#DD344C] text-white hover:opacity-90 cursor-pointer shrink-0"
                      >
                        Factory reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KEYBOARD SHORTCUTS */}
            {activeSettingsTab === 'shortcuts' && (
              <div className="space-y-4">
                <div className="text-[12px] font-bold text-[var(--aws-text-primary)]">
                  Global &amp; Workspace Keyboard Shortcuts
                </div>

                <div className="rounded-[8px] border border-[var(--aws-border)] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="bg-[var(--aws-page-bg)] border-b border-[var(--aws-border)] text-[var(--aws-text-muted)] font-semibold text-[11px]">
                      <tr>
                        <th className="px-3.5 py-2">Command</th>
                        <th className="px-3.5 py-2">Shortcut</th>
                        <th className="px-3.5 py-2">Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--aws-border)] text-[var(--aws-text-primary)]">
                      {[
                        { cmd: 'Open search / Command palette', key: 'Ctrl+K / ⌘K', scope: 'Global' },
                        { cmd: 'Open global settings', key: 'Ctrl+, / ⌘,', scope: 'Global' },
                        { cmd: 'Undo canvas action', key: 'Ctrl+Z / ⌘Z', scope: 'Canvas' },
                        { cmd: 'Redo canvas action', key: 'Ctrl+Y / ⌘Shift+Z', scope: 'Canvas' },
                        { cmd: 'Duplicate selected node', key: 'Ctrl+D / ⌘D', scope: 'Canvas' },
                        { cmd: 'Delete selected node or edge', key: 'Delete / Backspace', scope: 'Canvas' },
                        { cmd: 'Deselect / Close inspector & modal', key: 'Escape', scope: 'Global' },
                        { cmd: 'Fit architecture diagram to screen', key: 'F', scope: 'Canvas' },
                      ].map((item) => (
                        <tr key={item.cmd} className="hover:bg-[var(--aws-page-bg)]/50">
                          <td className="px-3.5 py-2 font-medium">{item.cmd}</td>
                          <td className="px-3.5 py-2 font-mono text-[11px]">
                            <kbd className="px-1.5 py-0.5 rounded bg-[var(--aws-page-bg)] border border-[var(--aws-border)] text-[var(--aws-text-muted)]">
                              {item.key}
                            </kbd>
                          </td>
                          <td className="px-3.5 py-2 text-[11px] text-[var(--aws-text-muted)] font-sans">{item.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
