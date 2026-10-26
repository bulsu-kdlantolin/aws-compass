import React from 'react';

export interface AnimatedIconProps {
  /** The currently active key corresponding to one of the child elements' keys or icon entries */
  activeKey: string;
  /** Child elements, each with a unique `key` matching `activeKey` */
  children?: React.ReactNode;
  /** Alternatively, a record of keyed ReactNodes */
  icons?: Record<string, React.ReactNode>;
  /** Additional classes applied to the outer grid container */
  className?: string;
  /** Explicit container size in pixels (default: 16) */
  size?: number | string;
}

/**
 * AnimatedIcon
 * 
 * Provides smooth, layout-shift-free cross-fading between icon states (e.g., idle -> spinner -> check).
 * Uses CSS grid stack ([grid-area:1/1]) and cubic-bezier(0.2, 0, 0, 1) spring physics with scale, blur, and opacity.
 * Fully supports prefers-reduced-motion: reduce by eliminating scale/blur transitions.
 */
export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  activeKey,
  children,
  icons,
  className = '',
  size = 16,
}) => {
  // Collect items from either icons prop or children
  const items: Array<{ key: string; node: React.ReactNode }> = [];

  if (icons) {
    Object.entries(icons).forEach(([key, node]) => {
      items.push({ key, node });
    });
  }

  if (children) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.key != null) {
        // React key might have prefix '.$', normalize it
        const rawKey = String(child.key).replace(/^\.\$/, '');
        items.push({ key: rawKey, node: child });
      }
    });
  }

  const dimensionStyle =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px` }
      : { width: size, height: size };

  return (
    <span
      style={dimensionStyle}
      aria-hidden="true"
      className={`inline-grid place-items-center relative shrink-0 select-none ${className}`}
    >
      {items.map(({ key, node }) => {
        const isActive = key === activeKey;
        return (
          <span
            key={key}
            className={`[grid-area:1/1] flex items-center justify-center w-full h-full transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:scale-100 motion-reduce:blur-none motion-reduce:duration-150 ${
              isActive
                ? 'scale-100 opacity-100 blur-none pointer-events-auto z-[1]'
                : 'scale-[0.25] opacity-0 blur-[4px] pointer-events-none z-0'
            }`}
          >
            {node}
          </span>
        );
      })}
    </span>
  );
};

export default AnimatedIcon;
