// src/components/ui/CompassBootScreen.tsx
// Signature AWS Compass Boot & Hydration Screen
// Features the animated official AWS Compass logo with realistic magnetic navigation physics,
// true fluid harmonic damping, and polished user-facing loading messages.

import React, { useState, useEffect } from 'react';
import { m, useReducedMotion } from 'motion/react';

export interface CompassBootScreenProps {
  className?: string;
  onFinish?: () => void;
}

export const CompassBootScreen: React.FC<CompassBootScreenProps> = ({ className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);

  const hydrationStages = [
    'Loading AWS Compass…',
    'Calibrating 230+ AWS services & catalog…',
    'Preparing interactive architecture canvas…',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % hydrationStages.length);
    }, 850);
    return () => clearInterval(timer);
  }, [hydrationStages.length]);

  return (
    <m.div
      key="compass-boot-screen"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: 'blur(6px)',
      }}
      transition={{
        duration: 0.24,
        ease: [0.2, 0, 0, 1],
      }}
      style={{
        backgroundColor: 'var(--aws-page-bg, #0F141A)',
        color: 'var(--aws-text-primary, #EAEDED)',
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none ${className}`}
      role="status"
      aria-live="polite"
      aria-label="AWS Compass workspace is loading"
    >
      {/* Centered Loading Hub Container */}
      <div className="flex flex-col items-center gap-6 max-w-xs w-full">
        {/* Animated Official AWS Compass Emblem Container (80x80px) */}
        <div className="relative size-[84px] flex items-center justify-center shrink-0">
          {/* Ambient Warm Amber Glow */}
          <div className="absolute -inset-4 rounded-full bg-[#FF9900]/15 dark:bg-[#FF9900]/20 blur-2xl pointer-events-none" />

          {/* Outer Subtle Degree Track (Slow 24s ambient rotation) */}
          <m.svg
            width="84"
            height="84"
            viewBox="0 0 84 84"
            className="absolute inset-0 pointer-events-none"
            animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
            transition={{
              duration: 24,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            <circle
              cx="42"
              cy="42"
              r="40"
              fill="none"
              stroke="currentColor"
              className="text-[#D5DBDB] dark:text-[#2A3647]"
              strokeWidth="1"
              strokeDasharray="2 6"
              opacity="0.6"
            />
          </m.svg>

          {/* Official AWS Compass Logo SVG (72x72px) with Authentic Geometry & Spinning Magnetic Needle */}
          <div className="relative size-[72px] flex items-center justify-center rounded-full shadow-[0_12px_32px_rgba(255,153,0,0.3)]">
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 select-none overflow-visible"
              aria-label="AWS Compass Logo"
            >
              {/* 1. Outer Bezel / Circular Casing: Solid #FF9900 circular compass dial with inner highlight */}
              <circle
                cx="12"
                cy="12"
                r="11"
                fill="#FF9900"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="0.8"
              />

              {/* 2. Inner Precision Dial Ring */}
              <circle
                cx="12"
                cy="12"
                r="9.5"
                stroke="#0F141A"
                strokeWidth="0.8"
                opacity="0.8"
                fill="none"
              />

              {/* Azimuth Graduation Track */}
              <circle
                cx="12"
                cy="12"
                r="7.75"
                stroke="#0F141A"
                strokeWidth="0.5"
                strokeDasharray="0.8 1.2"
                opacity="0.45"
                fill="none"
              />

              {/* Major Cardinal Ticks (N, E, S, W) */}
              <line x1="12" y1="1.6" x2="12" y2="4.2" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="12" y1="19.8" x2="12" y2="22.4" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="1.6" y1="12" x2="4.2" y2="12" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="19.8" y1="12" x2="22.4" y2="12" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />

              {/* Minor Ordinal Ticks (NE, SE, SW, NW at 45°) */}
              <line x1="17.6" y1="6.4" x2="19.2" y2="4.8" stroke="#0F141A" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              <line x1="17.6" y1="17.6" x2="19.2" y2="19.2" stroke="#0F141A" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              <line x1="6.4" y1="17.6" x2="4.8" y2="19.2" stroke="#0F141A" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              <line x1="6.4" y1="6.4" x2="4.8" y2="4.8" stroke="#0F141A" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />

              {/* 3. Magnetic Directional Needle: Spins around like a real liquid-damped navigation compass */}
              <m.g
                style={{ transformOrigin: '12px 12px' }}
                animate={
                  shouldReduceMotion
                    ? { rotate: 0 }
                    : {
                      rotate: [0, 395, 335, 372, 354, 362, 360, 361.5, 360],
                    }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                      duration: 3.2,
                      times: [0, 0.35, 0.5, 0.65, 0.78, 0.88, 0.94, 0.97, 1],
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }
                }
              >
                {/* North-East Pointer: Deep Squid Ink (#0F141A) pointing at NE mark */}
                <polygon
                  points="12,12 10.2,10.2 17,7 13.8,13.8"
                  fill="#0F141A"
                />

                {/* South-West Tail: Crisp White (#FFFFFF) */}
                <polygon
                  points="12,12 13.8,13.8 7,17 10.2,10.2"
                  fill="#FFFFFF"
                />

                {/* Center Pivot Pin: #FF9900 pin with #0F141A border */}
                <circle cx="12" cy="12" r="1.35" fill="#FF9900" stroke="#0F141A" strokeWidth="0.6" />
                <circle cx="12" cy="12" r="0.5" fill="#0F141A" />
              </m.g>
            </svg>
          </div>
        </div>

        {/* Brand & Proper Loading Message Readout */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[16px] font-bold tracking-tight text-[#16191F] dark:text-[#EAEDED] m-0">
            AWS Compass
          </h1>

          {/* Cycling Live Stage Status with smooth crossfade */}
          <div className="h-5 flex items-center justify-center">
            <m.span
              key={stageIndex}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.22 }}
              className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]"
            >
              {hydrationStages[stageIndex]}
            </m.span>
          </div>

          {/* Ultra-slim Indeterminate Progress Shimmer */}
          <div className="w-[140px] h-[2.5px] rounded-full overflow-hidden bg-[#D5DBDB]/70 dark:bg-[#222D3C] mt-1 relative">
            <m.div
              className="h-full w-1/3 bg-[#FF9900] rounded-full"
              animate={
                shouldReduceMotion
                  ? { x: 0 }
                  : { x: ['-100%', '300%'] }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                    duration: 1.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
              }
            />
          </div>
        </div>
      </div>
    </m.div>
  );
};

export interface CompassLoaderProps {
  size?: number;
  label?: React.ReactNode;
  className?: string;
}

/**
 * Compact reusable CompassLoader using the authentic official AWS Compass logo with realistic spinning needle.
 * Used for blueprint switching, auto-layout, and backup imports.
 */
export const CompassLoader: React.FC<CompassLoaderProps> = ({
  size = 28,
  label,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-xs"
        >
          {/* Outer Bezel */}
          <circle
            cx="12"
            cy="12"
            r="11"
            fill="#FF9900"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="0.8"
          />
          {/* Inner Precision Ring */}
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke="#0F141A"
            strokeWidth="0.8"
            opacity="0.75"
            fill="none"
          />
          {/* Ticks */}
          <line x1="12" y1="1.6" x2="12" y2="4" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="22.4" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="1.6" y1="12" x2="4" y2="12" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="20" y1="12" x2="22.4" y2="12" stroke="#0F141A" strokeWidth="1.2" strokeLinecap="round" />

          {/* Spinning Needle */}
          <m.g
            style={{ transformOrigin: '12px 12px' }}
            animate={
              shouldReduceMotion
                ? { rotate: 0 }
                : { rotate: [0, 395, 335, 372, 354, 362, 360, 361.5, 360] }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                  duration: 3.2,
                  times: [0, 0.35, 0.5, 0.65, 0.78, 0.88, 0.94, 0.97, 1],
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }
            }
          >
            <polygon points="12,12 10.2,10.2 17,7 13.8,13.8" fill="#0F141A" />
            <polygon points="12,12 13.8,13.8 7,17 10.2,10.2" fill="#FFFFFF" />
            <circle cx="12" cy="12" r="1.35" fill="#FF9900" stroke="#0F141A" strokeWidth="0.6" />
            <circle cx="12" cy="12" r="0.5" fill="#0F141A" />
          </m.g>
        </svg>
      </div>

      {label && (
        <span className="text-[12px] font-medium text-[#545B64] dark:text-[#879596] tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};

export default CompassBootScreen;
