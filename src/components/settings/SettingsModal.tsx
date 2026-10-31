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
  Check,
} from 'lucide-react';
import {
  useSettingsStore,
  type SettingsTab,
  type ThemePreference,
  type UIDensity,
  type CodeFontSize,
  type CanvasGridVariant,
  type SnapGridSize,
  type DefaultEdgeStyle,
  type InspectorDockPosition,
  type AWSRegion,
  type StudyTierFilter,
} from '../../store/useSettingsStore';
import { useCompassStore } from '../../store/useCompassStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { db, exportFullDatabase, importFullDatabase, resetDatabaseToDefaults } from '../../db/compassDb';
import { SettingsRow } from './SettingsRow';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { ShortcutKeycaps } from '../ui/Kbd';

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
    favorited: number;
    customBlueprints: number;
}> ({ totalServices: 0, favorited: 0, customBlueprints: 0 });

// Two-step destructive confirmation states
const [clearFavoritesConfirm, setClearFavoritesConfirm] = useState(false);
const [factoryResetConfirm, setFactoryResetConfirm] = useState(false);
const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

// Load live DB stats when opening the modal or switching to data tab
useEffect(() => {
  if (!isSettingsOpen) {
    setClearFavoritesConfirm(false);
    setFactoryResetConfirm(false);
    setActionSuccessMsg(null);
    return;
  }

  const loadStats = async () => {
    try {
      const services = await db.services.toArray();
      const diagrams = await db.diagrams.toArray();
      const customBlueprints = diagrams.filter((d) => d.id !== 'active-canvas-diagram').length;
      const favorited = services.filter((s) => s.isFavorite).length;

      setStats({
        totalServices: services.length,
        favorited,
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

  const handleClearAllFavorites = async () => {
    try {
      await db.transaction('rw', db.services, async () => {
        const services = await db.services.toArray();
        for (const s of services) {
          if (s.isFavorite) {
            await db.services.update(s.id, {
              isFavorite: false,
              updatedAt: Date.now(),
            });
          }
        }
      });
      await refreshServices();
      setClearFavoritesConfirm(false);
      showSuccess('All favorited bookmarks cleared');
    } catch (err) {
      alert('Failed to clear favorites: ' + (err as Error).message);
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
    { id: 'study', label: 'Documentation & region', icon: <Globe className="w-4 h-4" /> },
    { id: 'data', label: 'Data, backup & reset', icon: <Database className="w-4 h-4" /> },
    { id: 'shortcuts', label: 'Keyboard shortcuts', icon: <Keyboard className="w-4 h-4" /> },
  ];

  const SHORTCUTS = [
    { cmd: 'Open search or command palette', keys: ['mod', 'K'], scope: 'Global' },
    { cmd: 'Open settings dialog', keys: ['mod', ','], scope: 'Global' },
    { cmd: 'Undo canvas edit', keys: ['mod', 'Z'], scope: 'Canvas' },
    { cmd: 'Redo canvas edit', keys: ['mod', 'Y'], scope: 'Canvas' },
    { cmd: 'Duplicate selected node', keys: ['mod', 'D'], scope: 'Canvas' },
    { cmd: 'Delete selected node or edge', keys: ['Delete'], scope: 'Canvas' },
    { cmd: 'Fit architecture diagram to view', keys: ['F'], scope: 'Canvas' },
    { cmd: 'Close modal or deselect', keys: ['Esc'], scope: 'Global' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
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

      <div className="max-w-[760px] w-[calc(100vw-2rem)] h-[560px] rounded-[16px] overflow-hidden flex border border-[#D5DBDB] dark:border-[#2A3647] bg-white dark:bg-[#161E2D] shadow-[0_20px_50px_rgba(0,0,0,0.45)] animate-in zoom-in-95 duration-150 select-none text-[#16191F] dark:text-[#EAEDED]">
        {/* Left Navigation Rail (w-52) */}
        <aside className="w-52 border-r border-[#EAEDED] dark:border-[#222D3C] bg-[#F8F9FA] dark:bg-[#0F141A] p-2 flex flex-col justify-between shrink-0">
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openSettings(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[12px] transition-all cursor-pointer text-left ${isActive
                    ? 'bg-[#EAEDED] dark:bg-[#1F2B3E] text-[#16191F] dark:text-white font-medium shadow-2xs'
                    : 'text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED]/50 dark:hover:bg-[#1F2B3E]/40 font-normal'
                    }`}
                >
                  <span className={isActive ? 'text-[#FF9900]' : 'text-current opacity-70'}>
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Settings Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#161E2D]">
          {/* Header */}
          <div className="h-12 px-6 border-b border-[#EAEDED] dark:border-[#222D3C] flex items-center justify-between shrink-0 bg-white dark:bg-[#161E2D]">
            <h2 id="settings-dialog-title" className="text-[14px] font-semibold text-[#16191F] dark:text-[#EAEDED]">
              {TABS.find((t) => t.id === activeSettingsTab)?.label}
            </h2>
            <button
              type="button"
              onClick={closeSettings}
              className="p-1 rounded-[6px] text-[#545B64] dark:text-[#879596] hover:text-[#16191F] dark:hover:text-[#EAEDED] hover:bg-[#EAEDED] dark:hover:bg-[#1F2B3E] transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {actionSuccessMsg && (
              <div className="p-2.5 rounded-[8px] bg-[#1D8102]/10 border border-[#1D8102]/30 text-[#1D8102] dark:text-[#38D9A9] flex items-center gap-2 font-medium text-[12px] mb-4">
                <Check className="w-4 h-4 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: APPEARANCE & DENSITY */}
            {activeSettingsTab === 'appearance' && (
              <div className="divide-y divide-[#EAEDED] dark:divide-[#222D3C]">
                <SettingsRow
                  title="Theme mode"
                  description="Select a color scheme for the application workspace."
                  control={
                    <SegmentedControl<ThemePreference>
                      ariaLabel="Theme mode"
                      value={theme}
                      onChange={setTheme}
                      options={[
                        { value: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5 text-[#FF9900]" /> },
                        { value: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5 text-[#539FE5]" /> },
                        { value: 'system', label: 'System', icon: <Laptop className="w-3.5 h-3.5 text-[#879596]" /> },
                      ]}
                    />
                  }
                />

                <SettingsRow
                  title="Workspace density"
                  description="Controls row heights across the resource table and sidebar tree."
                  control={
                    <SegmentedControl<UIDensity>
                      ariaLabel="Workspace density"
                      value={uiDensity}
                      onChange={setUiDensity}
                      options={[
                        { value: 'comfortable', label: 'Comfortable' },
                        { value: 'compact', label: 'Compact' },
                      ]}
                    />
                  }
                />

                <SettingsRow
                  title="Monospace font size"
                  description="Font scale for CLI commands and ARN specification blocks."
                  control={
                    <SegmentedControl<CodeFontSize>
                      ariaLabel="Monospace font size"
                      value={codeFontSize}
                      onChange={setCodeFontSize}
                      options={[
                        { value: '12px', label: '12px' },
                        { value: '13px', label: '13px' },
                        { value: '14px', label: '14px' },
                      ]}
                    />
                  }
                />
              </div>
            )}

            {/* TAB 2: ARCHITECTURE CANVAS */}
            {activeSettingsTab === 'canvas' && (
              <div className="divide-y divide-[#EAEDED] dark:divide-[#222D3C]">
                <SettingsRow
                  title="Background grid style"
                  description="Visual guide pattern rendered across canvas background."
                  control={
                    <SegmentedControl<CanvasGridVariant>
                      ariaLabel="Background grid style"
                      value={canvasGridVariant}
                      onChange={setCanvasGridVariant}
                      options={[
                        { value: 'dots', label: 'Dots' },
                        { value: 'lines', label: 'Lines' },
                        { value: 'cross', label: 'Cross' },
                        { value: 'none', label: 'None' },
                      ]}
                    />
                  }
                />

                <div>
                  <SettingsRow
                    title="Snap to alignment grid"
                    description="Automatically aligns nodes and boundaries during drag operations."
                    control={
                      <ToggleSwitch
                        ariaLabel="Snap nodes to alignment grid"
                        checked={snapToGrid}
                        onChange={setSnapToGrid}
                      />
                    }
                  />

                  {snapToGrid && (
                    <SettingsRow
                      isSubRow
                      title="Grid step size"
                      description="Snapping interval in pixels."
                      control={
                        <SegmentedControl<SnapGridSize>
                          size="sm"
                          ariaLabel="Grid step size"
                          value={snapGridSize}
                          onChange={setSnapGridSize}
                          options={[
                            { value: 16, label: '16px' },
                            { value: 24, label: '24px' },
                            { value: 32, label: '32px' },
                          ]}
                        />
                      }
                    />
                  )}
                </div>

                <SettingsRow
                  title="Default connection routing"
                  description="Routing algorithm for newly created service connections."
                  control={
                    <SegmentedControl<DefaultEdgeStyle>
                      ariaLabel="Default connection routing"
                      value={defaultEdgeStyle}
                      onChange={setDefaultEdgeStyle}
                      options={[
                        { value: 'smoothstep', label: 'Smooth step' },
                        { value: 'bezier', label: 'Bezier' },
                        { value: 'straight', label: 'Straight' },
                      ]}
                    />
                  }
                />

                <SettingsRow
                  title="Animate edge traffic by default"
                  description="Renders animated SVG stroke pulses along service connections."
                  control={
                    <ToggleSwitch
                      ariaLabel="Animate edge traffic by default"
                      checked={animateEdgesByDefault}
                      onChange={setAnimateEdgesByDefault}
                    />
                  }
                />

                <SettingsRow
                  title="Show canvas minimap"
                  description="Display floating viewport preview in the bottom corner."
                  control={
                    <ToggleSwitch
                      ariaLabel="Show canvas minimap"
                      checked={showMiniMap}
                      onChange={setShowMiniMap}
                    />
                  }
                />

                <SettingsRow
                  title="Inspector dock position"
                  description="Default dock edge for the dual-tab Sandbox Inspector."
                  control={
                    <SegmentedControl<InspectorDockPosition>
                      ariaLabel="Inspector dock position"
                      value={inspectorDockPosition}
                      onChange={setInspectorDockPosition}
                      options={[
                        { value: 'right', label: 'Right' },
                        { value: 'bottom', label: 'Bottom' },
                      ]}
                    />
                  }
                />
              </div>
            )}

            {/* TAB 3: STUDY & REGION DEFAULTS */}
            {activeSettingsTab === 'study' && (
              <div className="divide-y divide-[#EAEDED] dark:divide-[#222D3C]">
                <SettingsRow
                  title="Default AWS Region"
                  description="Target region reflected across ARN examples and blueprint headers."
                  control={
                    <SegmentedControl<AWSRegion>
                      ariaLabel="Default AWS Region"
                      value={defaultAwsRegion}
                      onChange={setDefaultAwsRegion}
                      options={[
                        { value: 'us-east-1', label: 'us-east-1' },
                        { value: 'us-west-2', label: 'us-west-2' },
                        { value: 'eu-west-1', label: 'eu-west-1' },
                        { value: 'ap-southeast-1', label: 'ap-southeast-1' },
                      ]}
                    />
                  }
                />

                <SettingsRow
                  title="Default exam tier filter"
                  description="Pre-selects an exam tier filter when launching the service catalog."
                  control={
                    <SegmentedControl<StudyTierFilter>
                      ariaLabel="Default exam tier filter"
                      value={defaultStudyTierFilter}
                      onChange={setDefaultStudyTierFilter}
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 1, label: 'Tier 1' },
                        { value: 2, label: 'Tier 2' },
                        { value: 3, label: 'Tier 3' },
                      ]}
                    />
                  }
                />

                <SettingsRow
                  title="Auto-expand architectural flowcharts"
                  description="Renders full-height Mermaid enterprise diagrams inside dossiers."
                  control={
                    <ToggleSwitch
                      ariaLabel="Auto-expand architectural flowcharts"
                      checked={autoExpandMermaid}
                      onChange={setAutoExpandMermaid}
                    />
                  }
                />
              </div>
            )}

            {/* TAB 4: DATA, BACKUP & RESET */}
            {activeSettingsTab === 'data' && (
              <div>
                {/* Horizontal Telemetry Readout */}
                <div className="py-2.5 px-3.5 mb-4 rounded-[8px] bg-[#F8F9FA] dark:bg-[#0F141A] border border-[#EAEDED] dark:border-[#222D3C] text-[12px] font-mono text-[#545B64] dark:text-[#879596] flex items-center justify-between tabular-nums">
                  <div className="flex items-center gap-2">
                    <span className="text-[#16191F] dark:text-[#EAEDED] font-semibold">{stats.totalServices}</span>
                    <span className="font-sans text-[11px]">services</span>
                    <span className="text-[#879596]">·</span>
                    <span className="text-[#FF9900] font-semibold">{stats.favorited}</span>
                    <span className="font-sans text-[11px]">favorited</span>
                    <span className="text-[#879596]">·</span>
                    <span className="text-[#0972D3] dark:text-[#539FE5] font-semibold">{stats.customBlueprints}</span>
                    <span className="font-sans text-[11px]">custom blueprints</span>
                  </div>
                  <div className="text-[11px] text-[#879596] font-sans">IndexedDB active</div>
                </div>

                <div className="divide-y divide-[#EAEDED] dark:divide-[#222D3C]">
                  <SettingsRow
                    title="Export workspace backup"
                    description="Export notes, custom blueprints, and favorited bookmarks as a portable JSON file."
                    control={
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="h-8 px-3 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-white dark:bg-[#161E2D] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2B3E] text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FF9900]" />
                        <span>Export .json</span>
                      </button>
                    }
                  />

                  <SettingsRow
                    title="Import workspace backup"
                    description="Restore notes, custom blueprints, and progress from an existing backup JSON file."
                    control={
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-3 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-white dark:bg-[#161E2D] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2B3E] text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#539FE5]" />
                        <span>Import .json</span>
                      </button>
                    }
                  />

                  <SettingsRow
                    title="Clear all favorites"
                    description="Removes all services from your favorites bookmarks. Custom blueprints and notes are preserved."
                    control={
                        clearFavoritesConfirm ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setClearFavoritesConfirm(false)}
                              className="h-7 px-2.5 text-[11px] rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] text-[#545B64] dark:text-[#879596] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2B3E] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleClearAllFavorites}
                              className="h-7 px-2.5 text-[11px] font-medium rounded-[6px] bg-[#D13212] text-white hover:bg-[#B0280D] cursor-pointer"
                            >
                              Confirm clear
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setClearFavoritesConfirm(true)}
                            className="h-8 px-3 rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] bg-white dark:bg-[#161E2D] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2B3E] text-[12px] font-medium text-[#16191F] dark:text-[#EAEDED] transition-colors cursor-pointer shadow-2xs"
                          >
                            Clear favorites...
                          </button>
                        )
                                                                }
                  />

                  <SettingsRow
                    title="Factory reset database"
                    description="Wipes all custom changes and restores initial seed services and blueprints."
                    control={
                      factoryResetConfirm ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFactoryResetConfirm(false)}
                            className="h-7 px-2.5 text-[11px] rounded-[6px] border border-[#D5DBDB] dark:border-[#2A3647] text-[#545B64] dark:text-[#879596] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2B3E] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleFactoryReset}
                            className="h-7 px-2.5 text-[11px] font-semibold rounded-[6px] bg-[#D13212] text-white hover:bg-[#B0280D] cursor-pointer"
                          >
                            Confirm factory reset
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFactoryResetConfirm(true)}
                          className="h-8 px-3 rounded-[6px] border border-[#D13212]/30 dark:border-[#FF7359]/30 text-[#D13212] dark:text-[#FF7359] hover:bg-[#D13212]/10 text-[12px] font-medium transition-colors cursor-pointer"
                        >
                          Factory reset...
                        </button>
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* TAB 5: KEYBOARD SHORTCUTS */}
            {activeSettingsTab === 'shortcuts' && (
              <div className="divide-y divide-[#EAEDED] dark:divide-[#222D3C]">
                {SHORTCUTS.map((item) => (
                  <div
                    key={item.cmd}
                    className="flex items-center justify-between gap-6 py-3.5"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <span className="text-[13px] font-medium text-[#16191F] dark:text-[#EAEDED]">
                        {item.cmd}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#545B64] dark:text-[#879596] bg-[#F8F9FA] dark:bg-[#0F141A] border border-[#EAEDED] dark:border-[#222D3C]">
                        {item.scope}
                      </span>
                    </div>
                    <div className="shrink-0">
                      <ShortcutKeycaps keys={item.keys} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
