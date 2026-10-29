import React from 'react';
import {
  BookOpen,
  LayoutGrid,
  Search,
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
  const theme = useCompassStore((s) => s.theme);

  const openSettings = useSettingsStore((s) => s.openSettings);
  const setTheme = useSettingsStore((s) => s.setTheme);

    const handleToggleTheme = () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Study Telemetry metrics
    const totalCount = services.length || 30;
    const masteredCount = services.filter((s) => s.studyStatus === 'mastered').length;
    const inProgressCount = services.filter((s) => s.studyStatus === 'in-progress').length;

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

  {/* ZONE 2 (Center Zone): Recessed Command Palette Trigger */ }
  < div className = "flex-1 max-w-sm mx-4 hidden md:flex justify-center" >
    <button
      type="button"
      onClick={onOpenCommandPalette}
      className="h-8 w-80 rounded-[6px] bg-[#090D12]/80 border border-[#354150] hover:border-[#545B64] px-3 flex items-center text-[13px] text-[#879596] hover:text-[#EAEDED] transition-colors cursor-pointer group"
      title="Open search (Ctrl+K)"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Search className="w-3.5 h-3.5 text-[#879596] group-hover:text-[#EAEDED] shrink-0" strokeWidth={1.75} />
        <span className="truncate">Search services, CLI, blueprints...</span>
      </div>
    </button>
      </div >

    {/* ZONE 3 (Right Zone): Telemetry Readout, Divider, Theme Toggle & Settings */ }
    < div className = "flex items-center gap-2.5" >
      {/* Mobile Search Icon Trigger */ }
      < button
type = "button"
onClick = { onOpenCommandPalette }
className = "md:hidden size-8 rounded-[6px] flex items-center justify-center text-[#879596] hover:text-[#EAEDED] hover:bg-white/5 cursor-pointer"
title = "Open search"
  >
  <Search className="w-4 h-4" strokeWidth={1.75} />
        </button >

{/* 1. Compact Study Telemetry Readout */ }
<div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#090D12]/60 border border-[#354150]/80 text-[11px] select-none font-mono">
  <div className="flex items-center gap-1.5 text-[#879596]">
    <span className="font-semibold text-[#1D8102]">{masteredCount}</span> Mastered
    <span className="text-[#545B64]">·</span>
    <span className="font-semibold text-[#539FE5]">{inProgressCount}</span> In Progress
  </div>
  {/* Mini 2-color Progress Bar (44px wide) */}
  <div className="w-11 h-1.5 rounded-full bg-[#161E2D] overflow-hidden flex shrink-0">
    <div
      style={{ width: `${(masteredCount / totalCount) * 100}%` }}
      className="h-full bg-[#1D8102] transition-all duration-300"
      title={`${masteredCount} Mastered`}
    />
    <div
      style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
      className="h-full bg-[#0972D3] transition-all duration-300"
      title={`${inProgressCount} In Progress`}
    />
  </div>
</div>

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
