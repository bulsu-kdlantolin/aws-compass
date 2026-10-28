import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCompassStore } from './store/useCompassStore';
import { useCanvasStore } from './store/useCanvasStore';
import { Navbar } from './components/layout/Navbar';
import { ServiceCatalog } from './components/catalog/ServiceCatalog';
import { ConceptVault } from './components/vault/ConceptVault';
import { ArchitectureCanvas } from './components/canvas/ArchitectureCanvas';
import { CommandPalette } from './components/layout/CommandPalette';
import { DisableThemeTransitions } from './components/ui/DisableThemeTransitions';
import { AWSCompassLogo } from './components/ui/AWSCompassLogo';

export const App: React.FC = () => {
  const {
    isDbLoaded,
    isSidebarOpen,
    toggleSidebar,
    workspaceMode,
    services,
    selectedServiceId,
    initialize,
  } = useCompassStore();
  const activeDiagramName = useCanvasStore((s) => s.activeDiagramName);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

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

  // Global Ctrl+K / Cmd+K Command Palette listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isDbLoaded) {
    return (
      <div
        style={{
          backgroundColor: 'var(--aws-page-bg)',
          color: 'var(--aws-text-primary)',
        }}
        className="w-screen h-screen flex flex-col items-center justify-center p-4 font-sans select-none"
      >
        <DisableThemeTransitions />
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3.5 p-6 rounded-[8px] border border-[var(--aws-border)] bg-[var(--aws-card-bg)] shadow-lg max-w-sm w-full mx-4 animate-in fade-in duration-200"
        >
          <span className="sr-only">Initializing AWS Compass catalog…</span>
          <AWSCompassLogo size={42} className="animate-pulse" />
          <span className="text-[13px] font-medium text-[var(--aws-text-muted)] tracking-wide">
            Initializing AWS Compass catalog…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--aws-page-bg)',
        color: 'var(--aws-text-primary)',
      }}
      className="flex flex-col w-screen h-screen overflow-hidden font-sans"
    >
      <DisableThemeTransitions />
      {/* Top Application Bar */}
      <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

      {/* Main App Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Service Catalog Sidebar */}
        {isSidebarOpen && <ServiceCatalog />}

        {/* Collapsed Sidebar Docked Trigger (Cloudscape AppLayout style) */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute left-0 top-2 z-30 h-8 pl-2.5 pr-3 rounded-r-[6px] bg-[var(--aws-card-bg)] border-y border-r border-[var(--aws-border)] shadow-md hover:border-[#FF9900] text-[var(--aws-text-primary)] hover:text-[#FF9900] flex items-center gap-1.5 transition-all duration-150 cursor-pointer group"
            title="Open service catalog"
            aria-label="Open service catalog"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[var(--aws-text-muted)] group-hover:text-[#FF9900] transition-colors" strokeWidth={2} />
            <span className="text-[11px] font-semibold tracking-wide">Catalog</span>
          </button>
        )}

        {/* Workspace Area: Concept Vault or Architecture Canvas */}
        <main className="flex-1 h-full overflow-hidden relative">
          {workspaceMode === 'vault' ? (
            <ConceptVault />
          ) : (
            <ArchitectureCanvas />
          )}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};

export default App;
