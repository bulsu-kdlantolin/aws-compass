// src/components/ui/DisableThemeTransitions.tsx
// Ported from loading-dev: temporarily injects transition:none during theme switches
// to prevent 500 elements from flashing at different speeds while preserving hover/spring physics during normal use.

import React, { useEffect, useRef } from 'react';
import { useCompassStore } from '../../store/useCompassStore';
import { disableTransitionsTemporarily } from '../../utils/themeTransitions';

export const DisableThemeTransitions: React.FC = () => {
  const theme = useCompassStore((s) => s.theme);
  const isFirstRender = useRef(true);

  // Trigger whenever user toggles between Light and Dark mode in the application
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    disableTransitionsTemporarily();
  }, [theme]);

  // Also trigger if system OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      disableTransitionsTemporarily();
    };

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return null;
};

export default DisableThemeTransitions;
