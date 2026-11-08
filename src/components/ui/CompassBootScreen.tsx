// src/components/ui/CompassBootScreen.tsx
// Signature AWS Compass Boot & Hydration Screen
// Features the animated official AWS Compass logo with realistic magnetic navigation physics,
// true fluid harmonic damping, polished user-facing loading messages, and a continuous
// determinate loading bar showing the line moving from 1% to 100% until loading completes.

import React, { useState, useEffect, useRef } from 'react';
import { m, useReducedMotion } from 'motion/react';

export interface CompassBootScreenProps {
  className?: string;
  isReady?: boolean;
  onFinish?: () => void;
}

  export const CompassBootScreen: React.FC<CompassBootScreenProps> = ({
    className = '',
    isReady = true,
    onFinish,
  }) => {
    const shouldReduceMotion = useReducedMotion();
    const [progress, setProgress] = useState(1);
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;

    useEffect(() => {
    if (shouldReduceMotion) {
      setProgress(100);
      const timer = setTimeout(() => {
        onFinishRef.current?.();
      }, 120);
      return () => clearTimeout(timer);
    }

    let animationFrameId: number;
    const startTime = performance.now();
    let readyTimestamp: number | null = null;
    let finishTriggered = false;
    let initialProgressWhenReady = 1;

    // Minimum visible sweep duration so the user perceives the line moving from 1% to 100%
    const MIN_SWEEP_MS = 700;
    const FINISH_SETTLE_MS = 180;

    const tick = (now: number) => {
      const elapsed = now - startTime;

      if (!isReady) {
        // While waiting for database and canvas hydration, smoothly advance from 1% to ~92%
        let current: number;
        if (elapsed < 200) {
          current = 1 + (elapsed / 200) * 29; // 1% -> 30%
        } else if (elapsed < 500) {
          current = 30 + ((elapsed - 200) / 300) * 40; // 30% -> 70%
        } else if (elapsed < 800) {
          current = 70 + ((elapsed - 500) / 300) * 18; // 70% -> 88%
        } else {
          // Creep gently towards 94% while awaiting backend ready state
          const extra = Math.min(6, (elapsed - 800) / 600);
          current = 88 + extra;
        }
        setProgress(Math.min(94, Math.max(1, current)));
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Database & canvas initialization ready!
        if (readyTimestamp === null) {
          readyTimestamp = now;
          const currentP = Math.min(
            94,
            Math.max(
              1,
              elapsed < 200
                ? 1 + (elapsed / 200) * 29
                : elapsed < 500
                  ? 30 + ((elapsed - 200) / 300) * 40
                  : elapsed < 800
                    ? 70 + ((elapsed - 500) / 300) * 18
                    : 88 + Math.min(6, (elapsed - 800) / 600)
            )
          );
          initialProgressWhenReady = currentP;
        }

        const timeSinceReady = now - readyTimestamp;
        const totalElapsed = now - startTime;

        // Ensure minimum sweep time has elapsed so the line animation is visible and smooth
        const remainingToMin = Math.max(0, MIN_SWEEP_MS - totalElapsed);
        const accelerationDuration = Math.max(220, remainingToMin);

        const fillRatio = Math.min(1, timeSinceReady / accelerationDuration);
        // Smooth ease-out cubic curve
        const easeOut = 1 - Math.pow(1 - fillRatio, 3);
        const nextProgress = initialProgressWhenReady + (100 - initialProgressWhenReady) * easeOut;

        setProgress(Math.min(100, Math.max(1, nextProgress)));

        if (fillRatio >= 1 && !finishTriggered) {
          finishTriggered = true;
          setProgress(100);
          setTimeout(() => {
            onFinishRef.current?.();
          }, FINISH_SETTLE_MS);
          return;
        }

        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    // Hard fallback safety timer (5s)
    const safetyTimer = setTimeout(() => {
      if (!finishTriggered) {
        setProgress(100);
        onFinishRef.current?.();
      }
    }, 5000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(safetyTimer);
    };
  }, [isReady, shouldReduceMotion]);

  const getStageLabel = (p: number) => {
    if (p < 36) return 'Loading AWS Compass…';
    if (p < 76) return 'Calibrating 230+ AWS services & catalog…';
    if (p < 99) return 'Preparing interactive architecture canvas…';
    return 'Opening workspace…';
  };

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
          <div className="flex flex-col items-center gap-2 text-center w-full">
            <h1 className="text-[16px] font-bold tracking-tight text-[#16191F] dark:text-[#EAEDED] m-0">
              AWS Compass
            </h1>

            {/* Cycling Live Stage Status with smooth crossfade */}
            <div className="h-5 flex items-center justify-center">
              <m.span
                key={getStageLabel(progress)}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.18 }}
                className="text-[12px] font-medium text-[#545B64] dark:text-[#879596]"
              >
                {getStageLabel(progress)}
              </m.span>
            </div>

              {/* Continuous Moving Determinate Loading Bar (Starts at 1% up to 100%, without numeric text) */}
              <div
                className="w-[220px] sm:w-[240px] flex flex-col items-center gap-1.5 mt-1"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={1}
                aria-valuemax={100}
                aria-label="Loading AWS Compass workspace"
              >
                <div className="w-full h-[3.5px] rounded-full overflow-hidden bg-[#D5DBDB]/70 dark:bg-[#253040] relative">
                  <div
                    className="h-full bg-[#FF9900] rounded-full relative"
                    style={{
                      width: `${Math.min(100, Math.max(1, progress))}%`,
                      boxShadow: '0 0 10px rgba(255, 153, 0, 0.65)',
                      willChange: 'width',
                    }}
                  >
                    {/* Subtle leading-edge specular highlight on the moving line tip */}
                    <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/45 rounded-full blur-[0.5px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </m.div>
        );
};

        export interface CompassLoaderProps {
          size ?: number;
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
