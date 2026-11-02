// src/utils/motionTokens.ts
// Shared physics-based spring curves and motion tokens ported from loading-dev

export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 550,
  damping: 38,
  mass: 0.8,
} as const;

export const SPRING_SMOOTH = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
} as const;

export const SPRING_TOC = {
  type: 'spring',
  stiffness: 800,
  damping: 80,
  mass: 2,
} as const;

/**
 * Injects a temporary 260ms transition on .react-flow__node during Dagre / auto-layout calculations,
 * then cleans it up immediately after so manual dragging remains completely 0ms lag-free.
 */
export function withAutoLayoutGlide(
  fn: () => void,
  onComplete?: () => void,
  durationMs = 260
): void {
  if (typeof document === 'undefined') {
    fn();
    onComplete?.();
    return;
  }

  const existing = document.getElementById('auto-layout-glide');
  if (existing) {
    existing.remove();
  }

  const styleEl = document.createElement('style');
  styleEl.setAttribute('id', 'auto-layout-glide');
  styleEl.textContent = `
    .react-flow__node {
      transition: transform ${durationMs}ms cubic-bezier(0.2, 0, 0, 1) !important;
    }
  `;
  document.head.appendChild(styleEl);

  fn();

  setTimeout(() => {
    if (styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    onComplete?.();
  }, durationMs);
}

