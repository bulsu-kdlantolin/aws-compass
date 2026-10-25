import React, { useEffect } from 'react';
import { disableTransitionsTemporarily } from '../../utils/themeTransitions';

export const DisableThemeTransitions: React.FC = () => {
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
