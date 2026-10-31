import React from 'react';
import {
  BookOpen,
  LayoutGrid,
  Search,
  Star,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AWSCompassLogo } from '../ui/AWSCompassLogo';
import { AnimatedIcon } from '../ui/AnimatedIcon';

export interface TopNavbarProps {
  onOpenCommandPalette?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenCommandPalette }) => {
  const workspaceMode = useCompassStore((s) => s.workspaceMode);
  const setWorkspaceMode = useCompassStore((s) => s.setWorkspaceMode);
  const services = useCompassStore((s) => s.services);
  const filter = useCompassStore((s) => s.filter);
  const setFavoritesFilter = useCompassStore((s) => s.setFavoritesFilter);
  const theme = useCompassStore((s) => s.theme);

  const openSettings = useSettingsStore((s) => s.openSettings);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Favorites metrics
  const favoritesCount = services.filter((s) => s.isFavorite).length;

  return (
    <header
      style={{
        backgroundColor: 'var(--aws-header-bg)',
        borderBottomColor: '#354150',
      }}
      className="h-12 border-b px-3 flex items-center justify-between shrink-0 select-none z-20 relative text-[#EAEDED] rounded-none font-sans"
    >
      {/* ZONE 1 (Left Zone): Brand & Flush Full-Height Workspace Tabs */}
      <div className="flex items-center h-full gap-2">
        {/* Brand Identity Lockup */}
        <button
          type="button"
          onClick={() => setWorkspaceMode('vault')}
          className="group flex items-center gap-2.5 pl-0.5 pr-2 py-1 rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#539FE5] cursor-pointer select-none transition-opacity hover:opacity-95 text-left"
          title="AWS Compass"
        >
          <AWSCompassLogo size={28} />
          <span className="font-sans font-bold text-[14px] text-white tracking-[-0.01em]">
            AWS Compass
          </span>
        </button>

        {/* 1px Vertical Divider */}
        <div className="h-5 w-px bg-[#354150] shrink-0" aria-hidden="true" />

        {/* Flush Console Mode Tabs (Full-height h-12) */}
        <nav className="flex items-center h-full" aria-label="Console Workspace Mode">
          <button
            type="button"
            onClick={() => setWorkspaceMode('vault')}
            className={`relative h-12 px-3.5 flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer select-none ${workspaceMode === 'vault'
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
            className={`relative h-12 px-3.5 flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer select-none ${workspaceMode === 'canvas'
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
      </div >

      {/* ZONE 2 (Center Zone): Recessed Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:flex justify-center">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="h-8 w-full max-w-[380px] rounded-[6px] bg-[#090D12]/80 border border-[#354150] hover:border-[#545B64] px-3 flex items-center justify-between text-[13px] text-[#879596] hover:text-[#EAEDED] transition-colors cursor-pointer group shadow-2xs"
          title="Open search (Ctrl+K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center shrink-0" aria-hidden="true">
              <Search className="w-3.5 h-3.5 text-[#879596] group-hover:text-[#EAEDED]" strokeWidth={1.75} />
            </span>
            <span className="truncate leading-none">Search services, CLI, blueprints...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono text-[#879596] bg-white/5 border border-[#354150] px-1.5 py-0.5 rounded-[4px] ml-2 shrink-0 group-hover:border-[#545B64] group-hover:text-[#EAEDED]">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* ZONE 3 (Right Zone): Telemetry Readout, Divider, Theme Toggle & Settings */}
      < div className="flex items-center gap-2.5" >
        {/* Mobile Search Icon Trigger */}
        < button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-[#EAEDED] hover:bg-white/5 cursor-pointer"
          title="Open search"
        >
          <Search className="w-4 h-4" strokeWidth={1.75} />
        </button >

        {/* 1. Clean borderless Favorites quick-filter pill */}
        <button
          type="button"
          onClick={() => {
            setFavoritesFilter(!filter.favoritesOnly);
            if (workspaceMode !== 'vault') {
              setWorkspaceMode('vault');
            }
          }}
          className={`h-8 px-2.5 rounded-[6px] flex items-center gap-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer enabled:active:scale-[0.96] select-none ${filter.favoritesOnly
            ? 'bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/40 shadow-xs'
            : favoritesCount > 0
              ? 'text-[#EAEDED] hover:bg-white/8 hover:text-white border border-transparent'
              : 'text-[#879596] hover:bg-white/5 hover:text-[#EAEDED] border border-transparent'
            }`}
          title={filter.favoritesOnly ? 'Showing favorites only (Click to show all)' : 'Filter by favorited services'}
          aria-label="Favorites quick filter"
        >
          <Star
            className={`w-3.5 h-3.5 transition-colors ${filter.favoritesOnly || favoritesCount > 0
              ? 'fill-[#FF9900] text-[#FF9900]'
              : 'text-[#879596]'
              }`}
          />
          <span className="hidden sm:inline">Favorites</span>
          <span className="font-mono text-[11px] tabular-nums opacity-90">({favoritesCount})</span>
        </button>

        {/* 2. 1px Vertical Divider */}
        <div className="h-4 w-px bg-[#354150] shrink-0" aria-hidden="true" />

        {/* 3. Quick Theme Toggle Icon Button (size-8 borderless ghost button) */}
        <button
          type="button"
          onClick={handleToggleTheme}
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
          </AnimatedIcon >
        </button >

        {/* 4. Settings Gear Icon Button (size-8 borderless ghost button) */}
        <button
          type="button"
          onClick={() => openSettings('appearance')}
          className="size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-white hover:bg-white/8 cursor-pointer enabled:active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out"
          title="Settings (Ctrl+,)"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" strokeWidth={1.75} />
        </button >
      </div >
    </header >
  );
};

export default TopNavbar;
