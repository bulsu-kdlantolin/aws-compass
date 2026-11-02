// src/components/ui/MotionProvider.tsx
// Hardware-accelerated motion provider with lazy-loaded DOM animation features and reduced-motion support.

import React from 'react';
import { LazyMotion, domMax, MotionConfig } from 'motion/react';

export interface MotionProviderProps {
  children: React.ReactNode;
}

export const MotionProvider: React.FC<MotionProviderProps> = ({ children }) => {
  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
};

export default MotionProvider;

