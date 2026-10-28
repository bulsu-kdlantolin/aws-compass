import React from 'react';

export interface AWSCompassLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'tile' | 'mark';
}

/**
 * AWS Compass Brand Identity Logo
 * 
 * Authentic circular navigational compass design:
 * - variant="tile": Solid #FF9900 circular compass casing with concentric dial rings, 8 cardinal & ordinal ticks, and 45° faceted needle
 * - variant="mark": Standalone uncontained circular compass glyph for Command Palette, empty states, and loading indicators
 * - Hover physics (better-ui): Rotates needle smoothly by 12° on hover when inside a .group container
 */
export const AWSCompassLogo: React.FC<AWSCompassLogoProps> = ({
  size = 28,
  className = '',
  variant = 'tile',
}) => {
  if (variant === 'mark') {
    return <AWSCompassLogoMark size={size} className={className} />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="AWS Compass Logo"
    >
      {/* 1. Outer Bezel / Circular Casing: Real compass circular dial with subtle inner border */}
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="#FF9900"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="0.8"
      />

      {/* 2. Inner Precision Dial Ring */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="#0F141A"
        strokeWidth="1"
        opacity="0.75"
        fill="none"
      />

      {/* Subtle Azimuth Graduation Track */}
      <circle
        cx="12"
        cy="12"
        r="7.75"
        stroke="#0F141A"
        strokeWidth="0.5"
        strokeDasharray="1 1.4"
        opacity="0.4"
        fill="none"
      />

      {/* Major Cardinal Ticks (N, E, S, W) */}
      <line x1="12" y1="1.6" x2="12" y2="4.2" stroke="#0F141A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19.8" x2="12" y2="22.4" stroke="#0F141A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1.6" y1="12" x2="4.2" y2="12" stroke="#0F141A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19.8" y1="12" x2="22.4" y2="12" stroke="#0F141A" strokeWidth="1.5" strokeLinecap="round" />

      {/* Minor Ordinal Ticks (NE, SE, SW, NW at 45°) */}
      <line x1="17.6" y1="6.4" x2="19.2" y2="4.8" stroke="#0F141A" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="17.6" y1="17.6" x2="19.2" y2="19.2" stroke="#0F141A" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="6.4" y1="17.6" x2="4.8" y2="19.2" stroke="#0F141A" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="6.4" y1="6.4" x2="4.8" y2="4.8" stroke="#0F141A" strokeWidth="1" strokeLinecap="round" opacity="0.65" />

      {/* 3. Directional Needle: 45° asymmetric two-tone pointer with subtle hover physics */}
      <g
        className="transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] origin-center group-hover:rotate-12 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
        style={{ transformOrigin: '12px 12px' }}
      >
        {/* North-East Pointer: Solid #0F141A (Deep Squid Ink) pointing at NE cardinal mark */}
        <polygon
          points="12,12 10.2,10.2 17,7 13.8,13.8"
          fill="#0F141A"
        />

        {/* South-West Tail: Crisp #FFFFFF (White) */}
        <polygon
          points="12,12 13.8,13.8 7,17 10.2,10.2"
          fill="#FFFFFF"
        />

        {/* Center Pivot: #FF9900 pin with subtle border and inner pin */}
        <circle cx="12" cy="12" r="1.35" fill="#FF9900" stroke="#0F141A" strokeWidth="0.6" />
        <circle cx="12" cy="12" r="0.5" fill="#0F141A" />
      </g>
    </svg>
  );
};

/**
 * AWS Compass Standalone Logo Mark (Uncontained)
 * 
 * Used for Command Palette, empty states, and loading indicators.
 * Real circular compass geometry with semantic colors:
 * - Concentric bezel & dial: var(--aws-interactive) (#0972D3 light / #539FE5 dark)
 * - North-East needle: #FF9900 (AWS Brand Orange)
 * - South-West tail: currentColor (adapts to parent text color)
 * - Center pivot: #FF9900
 */
export const AWSCompassLogoMark: React.FC<Omit<AWSCompassLogoProps, 'variant'>> = ({
  size = 24,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="AWS Compass Mark"
    >
      {/* Outer Dial Circle */}
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke="var(--aws-interactive, #0972D3)"
        strokeWidth="1.25"
        fill="none"
      />

      {/* Inner Precision Dial Ring */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="var(--aws-interactive, #0972D3)"
        strokeWidth="0.75"
        opacity="0.6"
        fill="none"
      />

      {/* Azimuth Graduation Track */}
      <circle
        cx="12"
        cy="12"
        r="7.75"
        stroke="var(--aws-interactive, #0972D3)"
        strokeWidth="0.5"
        strokeDasharray="1 1.4"
        opacity="0.4"
        fill="none"
      />

      {/* Major Cardinal Ticks (N, E, S, W) */}
      <line x1="12" y1="1.6" x2="12" y2="4.2" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19.8" x2="12" y2="22.4" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1.6" y1="12" x2="4.2" y2="12" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19.8" y1="12" x2="22.4" y2="12" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Minor Ordinal Ticks (NE, SE, SW, NW at 45°) */}
      <line x1="17.6" y1="6.4" x2="19.2" y2="4.8" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="17.6" y1="17.6" x2="19.2" y2="19.2" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="6.4" y1="17.6" x2="4.8" y2="19.2" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <line x1="6.4" y1="6.4" x2="4.8" y2="4.8" stroke="var(--aws-interactive, #0972D3)" strokeWidth="1" strokeLinecap="round" opacity="0.65" />

      {/* Directional Needle */}
      <g
        className="transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] origin-center group-hover:rotate-12 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
        style={{ transformOrigin: '12px 12px' }}
      >
        {/* North-East Pointer: Solid #FF9900 */}
        <polygon
          points="12,12 10.2,10.2 17,7 13.8,13.8"
          fill="#FF9900"
        />

        {/* South-West Tail: currentColor */}
        <polygon
          points="12,12 13.8,13.8 7,17 10.2,10.2"
          fill="currentColor"
        />

        {/* Center Pivot: #FF9900 pin */}
        <circle cx="12" cy="12" r="1.35" fill="#FF9900" stroke="var(--aws-interactive, #0972D3)" strokeWidth="0.5" />
        <circle cx="12" cy="12" r="0.5" fill="var(--aws-interactive, #0972D3)" />
      </g>
    </svg>
  );
};

export default AWSCompassLogo;
