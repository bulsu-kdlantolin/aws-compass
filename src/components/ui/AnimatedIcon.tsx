// src/components/ui/AnimatedIcon.tsx
// Ported from loading-dev: fluid hardware-accelerated icon swap with spring physics, scale, and blur.

import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import { SPRING_SMOOTH } from '../../utils/motionTokens';

export interface AnimatedIconProps {
  /** The currently active key corresponding to one of the child elements' keys or icon entries */
  activeKey?: string | number | boolean;
  iconKey?: string | number | boolean;
  /** Child elements, or single child with activeKey */
  children?: React.ReactNode;
  /** Alternatively, a record of keyed ReactNodes */
  icons?: Record<string, React.ReactNode>;
  /** Additional classes applied to the outer container */
  className?: string;
  /** Explicit container size in pixels */
  size?: number | string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  activeKey,
  iconKey,
  children,
  icons,
  className = '',
  size,
}) => {
  const currentKey = String(iconKey !== undefined ? iconKey : activeKey ?? 'default');

    let activeNode: React.ReactNode = children;
    if (icons && icons[currentKey]) {
      activeNode = icons[currentKey];
    } else if (children && React.Children.count(children) > 1) {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.key != null) {
          const rawKey = String(child.key).replace(/^\.\$/, '');
          if (rawKey === currentKey) {
            activeNode = child;
          }
        }
      });
    }

    const style = size
      ? {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }
      : undefined;

    return (
      <span
        style={style}
        className={`inline-flex items-center justify-center relative ${className}`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={currentKey}
            initial={{ filter: 'blur(4px)', opacity: 0, scale: 0.25 }}
            animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
            exit={{ filter: 'blur(4px)', opacity: 0, scale: 0.25 }}
            transition={SPRING_SMOOTH}
            className="inline-flex items-center justify-center shrink-0"
          >
            {activeNode}
          </m.span>
        </AnimatePresence>
      </span>
    );
  };

  export default AnimatedIcon;
