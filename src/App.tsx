import React, { useEffect, useState } from 'react';
import { useCompassStore } from './store/useCompassStore';
import { Navbar } from './components/layout/Navbar';
import { ServiceCatalog } from './components/catalog/ServiceCatalog';
import { ConceptVault } from './components/vault/ConceptVault';
import { ArchitectureCanvas } from './components/canvas/ArchitectureCanvas';
import { CommandPalette } from './components/layout/CommandPalette';
import { Compass } from 'lucide-react';

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
        className="flex flex-col items-center justify-center w-screen h-screen"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-[var(--aws-brand)]/10 border border-[var(--aws-brand)]/30 flex items-center justify-center text-[var(--aws-brand)] shadow-xl animate-pulse">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p style={{ color: 'var(--aws-text-muted)' }} className="mt-4 font-mono text-xs">
          Loading AWS Compass Catalog...
        </p>
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
