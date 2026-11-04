import React, { useEffect, useState, useCallback } from 'react';
import { useCompassStore } from './store/useCompassStore';
import { useCanvasStore } from './store/useCanvasStore';
import { Navbar } from './components/layout/Navbar';
import { ConceptVault } from './components/vault/ConceptVault';
import { ArchitectureCanvas } from './components/canvas/ArchitectureCanvas';
import { CommandPalette } from './components/layout/CommandPalette';
import { SettingsModal } from './components/settings/SettingsModal';
import { DisableThemeTransitions } from './components/ui/DisableThemeTransitions';
import { MotionProvider } from './components/ui/MotionProvider';
import { CompassBootScreen } from './components/ui/CompassBootScreen';
import { useSettingsStore } from './store/useSettingsStore';
import { AnimatePresence, m } from 'motion/react';

export const App: React.FC = () => {
  const isDbLoaded = useCompassStore((s) => s.isDbLoaded);
  const workspaceMode = useCompassStore((s) => s.workspaceMode);
  const selectedServiceId = useCompassStore((s) => s.selectedServiceId);
  const initialize = useCompassStore((s) => s.initialize);

  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const isCanvasFullscreen = useCanvasStore((s) => s.isCanvasFullscreen);
  const setIsCanvasFullscreen = useCanvasStore((s) => s.setIsCanvasFullscreen);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMinBootPassed, setIsMinBootPassed] = useState(false);

  useEffect(() => {
    initialize();
    useCanvasStore.getState().initializeCanvas();
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
      const services = useCompassStore.getState().services;
      const selectedService = services.find((s) => s.id === selectedServiceId);
      if (selectedService) {
        const short = (selectedService as any).shortName;
        const serviceTitle = short ? `${short} (${selectedService.name})` : selectedService.name;
        document.title = `${serviceTitle} · Concept Vault · AWS Compass`;
      } else {
        document.title = 'Concept Vault · AWS Compass';
      }
    }
}, [isDbLoaded, workspaceMode, selectedServiceId, activeDiagramName]);

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

const handleOpenCommandPalette = useCallback(() => {
  setIsCommandPaletteOpen(true);
}, []);

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
              <Navbar onOpenCommandPalette={handleOpenCommandPalette} />
          )}

            {/* Main Workspace Area (GPU-accelerated, zero-layout-shift view transition) */}
            <main className="flex-1 h-full w-full overflow-hidden relative">
              {/* Concept Vault Workspace */}
              <div
                className={`absolute inset-0 w-full h-full transition-[opacity,visibility] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none will-change-[opacity] ${workspaceMode === 'vault'
                    ? 'opacity-100 visible z-10 pointer-events-auto'
                    : 'opacity-0 invisible -z-10 pointer-events-none'
                  }`}
                aria-hidden={workspaceMode !== 'vault'}
              >
                <ConceptVault />
              </div>

              {/* Architecture Canvas Workspace */}
              <div
                  className={`absolute inset-0 w-full h-full transition-[opacity,visibility] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none will-change-[opacity] ${workspaceMode === 'canvas'
                      ? 'opacity-100 visible z-10 pointer-events-auto'
                      : 'opacity-0 invisible -z-10 pointer-events-none'
                    }`}
              aria-hidden={workspaceMode !== 'canvas'}
              >
              <ArchitectureCanvas />
          </div>
        </main>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

  {/* Global Settings Modal (Ctrl+,) */ }
  < SettingsModal />
          </m.div >
        )}
      </AnimatePresence >
    </MotionProvider >
  );
};

export default App;
