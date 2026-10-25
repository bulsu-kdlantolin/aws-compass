import React, { useEffect, useState } from 'react';
import { useCompassStore } from './store/useCompassStore';
import { Navbar } from './components/layout/Navbar';
import { ServiceCatalog } from './components/catalog/ServiceCatalog';
import { ConceptVault } from './components/vault/ConceptVault';
import { ArchitectureCanvas } from './components/canvas/ArchitectureCanvas';
import { CommandPalette } from './components/layout/CommandPalette';
import { DisableThemeTransitions } from './components/ui/DisableThemeTransitions';
import { CloudscapeAppSkeleton } from './components/ui/CloudscapeSkeleton';

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
      <>
        <DisableThemeTransitions />
        <CloudscapeAppSkeleton />
      </>
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
