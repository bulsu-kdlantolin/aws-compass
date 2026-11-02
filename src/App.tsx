import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCompassStore } from './store/useCompassStore';
import { useCanvasStore } from './store/useCanvasStore';
import { Navbar } from './components/layout/Navbar';
import { ServiceCatalog } from './components/catalog/ServiceCatalog';
import { ConceptVault } from './components/vault/ConceptVault';
import { ArchitectureCanvas } from './components/canvas/ArchitectureCanvas';
import { CommandPalette } from './components/layout/CommandPalette';
import { SettingsModal } from './components/settings/SettingsModal';
import { DisableThemeTransitions } from './components/ui/DisableThemeTransitions';
import { MotionProvider } from './components/ui/MotionProvider';
import { CompassBootScreen } from './components/ui/CompassBootScreen';
import { useSettingsStore } from './store/useSettingsStore';
import { AnimatePresence, m } from 'motion/react';
import { SPRING_SMOOTH } from './utils/motionTokens';

export const App: React.FC = () => {
  const {
    isDbLoaded,
    isSidebarOpen,
    sidebarWidth,
    toggleSidebar,
    workspaceMode,
    services,
    selectedServiceId,
    initialize,
  } = useCompassStore();
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const isCanvasFullscreen = useCanvasStore((s) => s.isCanvasFullscreen);
  const setIsCanvasFullscreen = useCanvasStore((s) => s.setIsCanvasFullscreen);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMinBootPassed, setIsMinBootPassed] = useState(false);

  useEffect(() => {
    initialize();
    const timer = setTimeout(() => {
      setIsMinBootPassed(true);
    }, 450);
    return () => clearTimeout(timer);
  }, [initialize]);

  const isBooting = !isDbLoaded || !isMinBootPassed;

  // Dynamic Tab Title Sync (better-accessibility 2.4.2 SPA rules)
  useEffect(() => {
    if (!isDbLoaded) {
      document.title = 'AWS Compass · Cloud Architecture & Study Vault';
      return;
    }

    if (workspaceMode === 'canvas') {
      const blueprintName = activeDiagramName || 'Architecture Canvas';
      document.title = `${blueprintName} · Architecture Canvas · AWS Compass`;
    } else {
      const selectedService = services.find((s) => s.id === selectedServiceId);
      if (selectedService) {
        const short = (selectedService as any).shortName;
        const serviceTitle = short ? `${short} (${selectedService.name})` : selectedService.name;
        document.title = `${serviceTitle} · Concept Vault · AWS Compass`;
      } else {
        document.title = 'Concept Vault · AWS Compass';
      }
    }
  }, [isDbLoaded, workspaceMode, selectedServiceId, services, activeDiagramName]);

  // Global Keyboard Shortcuts (Ctrl+K Command Palette, Ctrl+, Settings, Shift+F Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
      } else if (e.shiftKey && e.key.toLowerCase() === 'f' && workspaceMode === 'canvas') {
        e.preventDefault();
        useCanvasStore.getState().toggleCanvasFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSettings, workspaceMode]);

  // Sync browser fullscreen API
  useEffect(() => {
    if (workspaceMode !== 'canvas') return;

    if (isCanvasFullscreen) {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => { });
      }
    } else {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => { });
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isCanvasFullscreen) {
        setIsCanvasFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isCanvasFullscreen, setIsCanvasFullscreen, workspaceMode]);

  return (
    <MotionProvider>
        <DisableThemeTransitions />
        <AnimatePresence mode="wait">
          {isBooting ? (
            <CompassBootScreen key="boot-screen" />
          ) : (
            <m.div
              key="workspace-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
              style={{
                backgroundColor: 'var(--aws-page-bg)',
                color: 'var(--aws-text-primary)',
              }}
              className="flex flex-col w-screen h-screen overflow-hidden font-sans"
            >
              {/* Top Application Bar (Hidden in Canvas Fullscreen / Zen Mode) */}
              {(!isCanvasFullscreen || workspaceMode !== 'canvas') && (
                <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
              )}

              {/* Main App Body */}
              <div className="flex flex-1 overflow-hidden relative">
                {/* Service Catalog Sidebar (Only active & usable in Concept Vault) with smooth width/opacity glide */}
                {workspaceMode === 'vault' && (
                  <div
                    style={{
                      width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
                    }}
                    className={`h-full shrink-0 relative overflow-hidden transition-[width,opacity,transform] duration-250 ease-[cubic-bezier(0.2,0,0,1)] ${isSidebarOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4 pointer-events-none'
                      }`}
                  >
                    <ServiceCatalog />
                  </div>
                )}

                {/* Collapsed Sidebar Docked Trigger (Only shown in Concept Vault) */}
                <AnimatePresence>
                  {workspaceMode === 'vault' && !isSidebarOpen && (
                    <m.button
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={SPRING_SMOOTH}
                      type="button"
                      onClick={toggleSidebar}
                      className="absolute left-0 top-2 z-30 h-8 pl-2.5 pr-3 rounded-r-[6px] bg-[var(--aws-card-bg)] border-y border-r border-[var(--aws-border)] shadow-md hover:border-[#FF9900] text-[var(--aws-text-primary)] hover:text-[#FF9900] flex items-center gap-1.5 transition-all duration-150 cursor-pointer group"
                      title="Open service catalog"
                      aria-label="Open service catalog"
                    >
                      <ChevronRight
                        className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[#FF9900] transition-colors"
                        strokeWidth={2}
                      />
                      <span className="text-[11px] font-semibold tracking-wide">Catalog</span>
                    </m.button>
                  )}
                </AnimatePresence>

                {/* Workspace Area: Concept Vault or Architecture Canvas with Crossfade */}
                <main className="flex-1 h-full overflow-hidden relative">
                  <m.div
                    key={workspaceMode}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
                    className="w-full h-full"
                  >
                    {workspaceMode === 'vault' ? (
                      <ConceptVault />
                    ) : (
                      <ArchitectureCanvas />
                    )}
                  </m.div>
                </main>
              </div>

              {/* Global Command Palette (Ctrl+K) */}
              <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
              />

        {/* Global Settings Modal (Ctrl+,) */}
        <SettingsModal />
      </m.div>
        )}
    </AnimatePresence>
    </MotionProvider >
  );
};

export default App;
