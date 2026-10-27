import React from 'react';

interface AWSCompassLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'badge' | 'flat';
}

/**
 * AWS Compass Bespoke Service Logo
 * Blends AWS Cloudscape Orange/Blue aesthetics with precision architectural compass iconography.
 */
export const AWSCompassLogo: React.FC<AWSCompassLogoProps> = ({
  size = 28,
  className = '',
  variant = 'badge',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="AWS Compass Logo"
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id="awsCompassBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B2533" />
          <stop offset="100%" stopColor="#0B1118" />
        </linearGradient>

        {/* North needle orange gradients (faceted 3D effect) */}
        <linearGradient id="northLight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF9900" />
          <stop offset="100%" stopColor="#FFBA49" />
        </linearGradient>
        <linearGradient id="northDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC7211" />
          <stop offset="100%" stopColor="#D45B07" />
        </linearGradient>

        {/* South needle blue gradients (faceted 3D effect) */}
        <linearGradient id="southLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#539FE5" />
          <stop offset="100%" stopColor="#2E80D2" />
        </linearGradient>
        <linearGradient id="southDark" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0972D3" />
          <stop offset="100%" stopColor="#065299" />
        </linearGradient>

        {/* AWS Smile Curve Accent */}
        <linearGradient id="awsSmileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF9900" />
          <stop offset="100%" stopColor="#FFB338" />
        </linearGradient>

        {/* Subtle drop shadow for dial */}
        <filter id="compassGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Optional Rounded Badge Frame */}
      {variant === 'badge' && (
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="14"
          fill="url(#awsCompassBg)"
          stroke="#354150"
          strokeWidth="1.5"
        />
      )}

      {/* Dial Outer Ring */}
      <circle
        cx="32"
        cy="32"
        r="23"
        stroke="#415164"
        strokeWidth="1.25"
        strokeDasharray="2 3"
        opacity="0.8"
      />

      {/* Dial Solid Precision Ring */}
      <circle
        cx="32"
        cy="32"
        r="18.5"
        stroke="#2E3C4D"
        strokeWidth="1.5"
      />

      {/* Cardinal Axis Tick Marks (N, S, E, W) */}
      <line x1="32" y1="5.5" x2="32" y2="10.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="53.5" x2="32" y2="58.5" stroke="#539FE5" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="5.5" y1="32" x2="10.5" y2="32" stroke="#879596" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="53.5" y1="32" x2="58.5" y2="32" stroke="#879596" strokeWidth="1.5" strokeLinecap="round" />

      {/* East & West Lateral Pointer Wings */}
      <path d="M 32 32 L 32 29 L 16 32 L 32 32 Z" fill="#65778A" />
      <path d="M 32 32 L 32 35 L 16 32 L 32 32 Z" fill="#4B5B6D" />
      <path d="M 32 32 L 32 29 L 48 32 L 32 32 Z" fill="#889BB0" />
      <path d="M 32 32 L 32 35 L 48 32 L 32 32 Z" fill="#65778A" />

      {/* South Needle: Cloudscape Blue Facets */}
      <path d="M 32 32 L 27 32 L 32 49 Z" fill="url(#southLight)" filter="url(#compassGlow)" />
      <path d="M 32 32 L 37 32 L 32 49 Z" fill="url(#southDark)" filter="url(#compassGlow)" />

      {/* North Needle: AWS Signature Orange Facets */}
      <path d="M 32 32 L 27 32 L 32 14 Z" fill="url(#northLight)" filter="url(#compassGlow)" />
      <path d="M 32 32 L 37 32 L 32 14 Z" fill="url(#northDark)" filter="url(#compassGlow)" />

      {/* Signature AWS Smile Arch on lower perimeter */}
      <path
        d="M 20 44 C 26 51, 38 51, 44 44"
        stroke="url(#awsSmileGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead on AWS smile arch */}
      <path
        d="M 44.5 41.5 L 45 45.5 L 41.5 45 Z"
        fill="#FF9900"
      />

      {/* Center Pivot Ring & Core */}
      <circle cx="32" cy="32" r="4.5" fill="#0B1118" stroke="#FF9900" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="2" fill="#FFFFFF" />
    </svg>
  );
};

export default AWSCompassLogo;
