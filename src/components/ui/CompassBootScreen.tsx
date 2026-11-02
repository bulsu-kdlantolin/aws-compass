// src/components/ui/CompassBootScreen.tsx
// High-craft AWS Compass Boot & Hydration Screen
// Features multi-layered animated AWS Compass emblem, magnetic needle physics, and telemetry readout.

import React, { useState, useEffect } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { Compass } from 'loading-dev';

export interface CompassBootScreenProps {
  className?: string;
  onFinish?: () => void;
}

export const CompassBootScreen: React.FC<CompassBootScreenProps> = ({ className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);

  const hydrationStages = [
    'Mounting IndexedDB catalog…',
    'Hydrating 230+ AWS service schemas…',
    'Initializing architecture canvas…',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % hydrationStages.length);
    }, 750);
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
      {/* Centered Telemetry Station Container */}
      <div className="flex flex-col items-center gap-5 max-w-xs w-full">
        {/* Animated 3-Layer Compass Emblem (size=72) */}
        <div className="relative size-[72px] flex items-center justify-center shrink-0">
          {/* Ambient Glow */}
          <div className="absolute -inset-3 rounded-full bg-[#FF9900]/10 dark:bg-[#FF9900]/15 blur-xl pointer-events-none" />

          {/* LAYER 1: Outer Cardinal Telemetry Ring */}
          {/* Rotating degree graduation track (20s linear infinite) */}
          <m.svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            className="absolute inset-0 pointer-events-none"
            animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
            transition={{
              duration: 20,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            <circle
              cx="36"
              cy="36"
              r="34"
              fill="none"
              stroke="currentColor"
              className="text-[#D5DBDB] dark:text-[#2A3647]"
              strokeWidth="1"
              strokeDasharray="2 6"
              opacity="0.8"
            />
          </m.svg>

          {/* Quarter-turning cardinal ticks from loading-dev */}
          <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
            <Compass size={68} color="#539FE5" duration={650} />
          </div>

          {/* LAYER 2: Isometric AWS Architecture Hexagon Cube */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* Top Cube Face (Diamond / Rhombus) */}
            <polygon
              points="36,18 51.6,27 36,36 20.4,27"
              fill="#FF9900"
              fillOpacity="0.14"
            />
            {/* Left Cube Face */}
            <polygon
              points="20.4,27 36,36 36,54 20.4,45"
              fill="#232F3E"
              fillOpacity="0.5"
            />
            {/* Right Cube Face */}
            <polygon
              points="51.6,27 36,36 36,54 51.6,45"
              fill="#16191F"
              fillOpacity="0.75"
            />

            {/* Breathing / Drawing Outline Stroke */}
            <m.path
              d="M 36,18 L 51.6,27 L 51.6,45 L 36,54 L 20.4,45 L 20.4,27 Z"
              stroke="currentColor"
              className="text-[#545B64] dark:text-[#879596]"
              strokeWidth="1.25"
              strokeLinejoin="round"
              fill="none"
              animate={
                shouldReduceMotion
                  ? { opacity: 0.9 }
                  : {
                    opacity: [0.65, 1, 0.65],
                  }
              }
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Interior Isometric Y-Axes */}
            <line
              x1="36"
              y1="36"
              x2="36"
              y2="54"
              stroke="currentColor"
              className="text-[#545B64] dark:text-[#879596]"
              strokeWidth="1"
              opacity="0.6"
            />
            <line
              x1="36"
              y1="36"
              x2="20.4"
              y2="27"
              stroke="currentColor"
              className="text-[#545B64] dark:text-[#879596]"
              strokeWidth="1"
              opacity="0.6"
            />
            <line
              x1="36"
              y1="36"
              x2="51.6"
              y2="27"
              stroke="currentColor"
              className="text-[#545B64] dark:text-[#879596]"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>

          {/* LAYER 3: Magnetic Seeking Compass Needle with Spring Physics */}
          <m.svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            className="absolute inset-0 pointer-events-none z-20"
            style={{ transformOrigin: '36px 36px' }}
            animate={
              shouldReduceMotion
                ? { rotate: 45 }
                : {
                  rotate: [0, -35, 110, 30, 52, 45, 405],
                }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                  duration: 2.8,
                  times: [0, 0.14, 0.42, 0.62, 0.78, 0.88, 1],
                  ease: [0.34, 1.56, 0.64, 1],
                  repeat: Infinity,
                  repeatDelay: 0.6,
                }
            }
          >
            {/* North-East Pointer (Top half): Two-tone Faceted AWS Brand Orange */}
            <polygon
              points="36,15 33,36 36,36"
              fill="#ED7100"
            />
            <polygon
              points="36,15 36,36 39,36"
              fill="#FF9900"
            />

            {/* South-West Tail (Bottom half): Two-tone Faceted Titanium / White */}
            <polygon
              points="36,57 33,36 36,36"
              fill="#D5DBDB"
            />
            <polygon
              points="36,57 36,36 39,36"
              fill="#FFFFFF"
            />

            {/* Center Pivot Pin */}
            <circle
              cx="36"
              cy="36"
              r="3.5"
              fill="#0F141A"
              stroke="#FF9900"
              strokeWidth="1"
            />
            <circle
              cx="36"
              cy="36"
              r="1.2"
              fill="#FF9900"
            />
          </m.svg>
        </div>

        {/* Minimalist Telemetry Readout Below Emblem */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-[15px] font-bold tracking-[-0.01em] text-[#16191F] dark:text-[#EAEDED] m-0">
            AWS Compass
          </h1>

          {/* Cycling Live Stage Status */}
          <div className="h-5 flex items-center justify-center">
            <m.span
              key={stageIndex}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] font-mono text-[#545B64] dark:text-[#879596] tabular-nums"
            >
              {hydrationStages[stageIndex]}
            </m.span>
          </div>

          {/* Ultra-slim Indeterminate Progress Shimmer */}
          <div className="w-[120px] h-[2px] rounded-full overflow-hidden bg-[#D5DBDB]/70 dark:bg-[#222D3C] mt-1 relative">
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
 * Compact reusable CompassLoader for blueprint switching, auto-layout, and backup imports.
 */
export const CompassLoader: React.FC<CompassLoaderProps> = ({
  size = 32,
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
        {/* Subtle Degree Ring */}
        <svg
          viewBox="0 0 72 72"
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none"
        >
          <circle
            cx="36"
            cy="36"
            r="33"
            fill="none"
            stroke="currentColor"
            className="text-[#D5DBDB] dark:text-[#2A3647]"
            strokeWidth="1.5"
            strokeDasharray="3 5"
            opacity="0.8"
          />
          {/* Hexagon outline */}
          <polygon
            points="36,18 51.6,27 51.6,45 L 36,54 20.4,45 20.4,27"
            fill="none"
            stroke="#FF9900"
            strokeWidth="1.25"
            opacity="0.4"
          />
        </svg>

        {/* Magnetic Seeking Needle */}
        <m.svg
          viewBox="0 0 72 72"
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none"
          style={{ transformOrigin: '36px 36px' }}
          animate={
            shouldReduceMotion
              ? { rotate: 45 }
              : {
                rotate: [0, -35, 110, 30, 52, 45, 405],
              }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                duration: 2.4,
                times: [0, 0.14, 0.42, 0.62, 0.78, 0.88, 1],
                ease: [0.34, 1.56, 0.64, 1],
                repeat: Infinity,
                repeatDelay: 0.4,
              }
          }
        >
          <polygon points="36,16 33,36 36,36" fill="#ED7100" />
          <polygon points="36,16 36,36 39,36" fill="#FF9900" />
          <polygon points="36,56 33,36 36,36" fill="#D5DBDB" />
          <polygon points="36,56 36,36 39,36" fill="#FFFFFF" />
          <circle cx="36" cy="36" r="3" fill="#0F141A" stroke="#FF9900" strokeWidth="1" />
        </m.svg>
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
