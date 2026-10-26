import React, { useEffect, useState } from 'react';
import { useCompassStore } from './store/useCompassStore';
import { Navbar } from './components/layout/Navbar';
import { ServiceCatalog } from './components/catalog/ServiceCatalog';
import { ConceptVault } from './components/vault/ConceptVault';
import { ArchitectureCanvas } from './components/canvas/ArchitectureCanvas';
import { CommandPalette } from './components/layout/CommandPalette';
import { DisableThemeTransitions } from './components/ui/DisableThemeTransitions';
import { Compass } from './components/ui/LoadingIndicators';

export const App: React.FC = () => {
  const { isDbLoaded, isSidebarOpen, workspaceMode, initialize } = useCompassStore();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
          <Compass size={28} color="#FF9900" />
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
