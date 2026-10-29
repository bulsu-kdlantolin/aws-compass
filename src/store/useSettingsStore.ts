import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { disableTransitionsTemporarily } from '../utils/themeTransitions';
import { useCompassStore } from './useCompassStore';

export type ThemePreference = 'dark' | 'light' | 'system';
export type UIDensity = 'comfortable' | 'compact';
export type StudyTierFilter = 'all' | 1 | 2 | 3;
export type CodeFontSize = '12px' | '13px' | '14px';
export type CanvasGridVariant = 'dots' | 'lines' | 'cross' | 'none';
export type SnapGridSize = 16 | 24 | 32;
export type DefaultEdgeStyle = 'smoothstep' | 'bezier' | 'straight';
export type InspectorDockPosition = 'right' | 'bottom';
export type AWSRegion = 'us-east-1' | 'ap-southeast-1' | 'eu-west-1' | 'us-west-2';

export type SettingsTab =
  | 'appearance'
  | 'canvas'
  | 'study'
  | 'data'
  | 'shortcuts';

export interface SettingsState {
  // Appearance & Density
  theme: ThemePreference;
  uiDensity: UIDensity;
  defaultStudyTierFilter: StudyTierFilter;
  codeFontSize: CodeFontSize;

  // Architecture Canvas Preferences
  canvasGridVariant: CanvasGridVariant;
  snapToGrid: boolean;
  snapGridSize: SnapGridSize;
  defaultEdgeStyle: DefaultEdgeStyle;
  animateEdgesByDefault: boolean;
  showMiniMap: boolean;
  inspectorDockPosition: InspectorDockPosition;

  // Study & Documentation
  defaultAwsRegion: AWSRegion;
  autoExpandMermaid: boolean;

  // Modal State
  isSettingsOpen: boolean;
  activeSettingsTab: SettingsTab;

  // Setters & Actions
  setTheme: (theme: ThemePreference) => void;
  setUiDensity: (density: UIDensity) => void;
  setDefaultStudyTierFilter: (filter: StudyTierFilter) => void;
  setCodeFontSize: (size: CodeFontSize) => void;

  setCanvasGridVariant: (variant: CanvasGridVariant) => void;
  setSnapToGrid: (snap: boolean) => void;
  setSnapGridSize: (size: SnapGridSize) => void;
  setDefaultEdgeStyle: (style: DefaultEdgeStyle) => void;
  setAnimateEdgesByDefault: (animate: boolean) => void;
  setShowMiniMap: (show: boolean) => void;
  setInspectorDockPosition: (pos: InspectorDockPosition) => void;

  setDefaultAwsRegion: (region: AWSRegion) => void;
  setAutoExpandMermaid: (expand: boolean) => void;

  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  resetAllSettings: () => void;
}

const DEFAULT_SETTINGS = {
  theme: 'dark' as ThemePreference,
  uiDensity: 'comfortable' as UIDensity,
  defaultStudyTierFilter: 'all' as StudyTierFilter,
  codeFontSize: '13px' as CodeFontSize,

  canvasGridVariant: 'dots' as CanvasGridVariant,
  snapToGrid: true,
  snapGridSize: 16 as SnapGridSize,
  defaultEdgeStyle: 'smoothstep' as DefaultEdgeStyle,
  animateEdgesByDefault: false,
  showMiniMap: true,
  inspectorDockPosition: 'right' as InspectorDockPosition,

  defaultAwsRegion: 'us-east-1' as AWSRegion,
  autoExpandMermaid: true,
};

export function applyThemePreference(pref: ThemePreference) {
  if (typeof window === 'undefined') return;

  disableTransitionsTemporarily();
  let resolved: 'dark' | 'light' = 'dark';

  if (pref === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = pref;
  }

  document.documentElement.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }

  // Sync with useCompassStore if active
  try {
    const compassStore = useCompassStore.getState();
    if (compassStore && compassStore.theme !== resolved) {
      compassStore.setTheme(resolved);
    }
  } catch {
    // Ignore early hydration mismatch
  }
}

// Media query listener for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const currentTheme = useSettingsStore.getState().theme;
    if (currentTheme === 'system') {
      applyThemePreference('system');
    }
  });
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isSettingsOpen: false,
      activeSettingsTab: 'appearance',

      setTheme: (theme: ThemePreference) => {
        set({ theme });
        applyThemePreference(theme);
      },

      setUiDensity: (uiDensity: UIDensity) => {
        set({ uiDensity });
      },

      setDefaultStudyTierFilter: (defaultStudyTierFilter: StudyTierFilter) => {
        set({ defaultStudyTierFilter });
      },

      setCodeFontSize: (codeFontSize: CodeFontSize) => {
        set({ codeFontSize });
      },

      setCanvasGridVariant: (canvasGridVariant: CanvasGridVariant) => {
        set({ canvasGridVariant });
      },

      setSnapToGrid: (snapToGrid: boolean) => {
        set({ snapToGrid });
      },

      setSnapGridSize: (snapGridSize: SnapGridSize) => {
        set({ snapGridSize });
      },

      setDefaultEdgeStyle: (defaultEdgeStyle: DefaultEdgeStyle) => {
        set({ defaultEdgeStyle });
      },

      setAnimateEdgesByDefault: (animateEdgesByDefault: boolean) => {
        set({ animateEdgesByDefault });
      },

      setShowMiniMap: (showMiniMap: boolean) => {
        set({ showMiniMap });
      },

      setInspectorDockPosition: (inspectorDockPosition: InspectorDockPosition) => {
        set({ inspectorDockPosition });
      },

      setDefaultAwsRegion: (defaultAwsRegion: AWSRegion) => {
        set({ defaultAwsRegion });
      },

      setAutoExpandMermaid: (autoExpandMermaid: boolean) => {
        set({ autoExpandMermaid });
      },

      openSettings: (tab: SettingsTab = 'appearance') => {
        set({ isSettingsOpen: true, activeSettingsTab: tab });
      },

      closeSettings: () => {
        set({ isSettingsOpen: false });
      },

      resetAllSettings: () => {
        set({ ...DEFAULT_SETTINGS });
        applyThemePreference(DEFAULT_SETTINGS.theme);
      },
    }),
    {
      name: 'aws-compass-settings',
      partialize: (state) => ({
        theme: state.theme,
        uiDensity: state.uiDensity,
        defaultStudyTierFilter: state.defaultStudyTierFilter,
        codeFontSize: state.codeFontSize,
        canvasGridVariant: state.canvasGridVariant,
        snapToGrid: state.snapToGrid,
        snapGridSize: state.snapGridSize,
        defaultEdgeStyle: state.defaultEdgeStyle,
        animateEdgesByDefault: state.animateEdgesByDefault,
        showMiniMap: state.showMiniMap,
        inspectorDockPosition: state.inspectorDockPosition,
        defaultAwsRegion: state.defaultAwsRegion,
        autoExpandMermaid: state.autoExpandMermaid,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemePreference(state.theme);
        }
      },
    }
  )
);

