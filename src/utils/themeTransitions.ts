/**
 * Temporarily disables all CSS transitions across the entire DOM tree
 * to prevent jarring color smearing during theme toggling.
 */
export function disableTransitionsTemporarily(): () => void {
  if (typeof document === 'undefined') return () => {};

  const css = document.createElement('style');
  css.setAttribute('type', 'text/css');
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  );
  document.head.appendChild(css);

  // Force style flush
  void document.body?.offsetHeight;

  let cancelled = false;

  const cleanup = () => {
    if (cancelled) return;
    cancelled = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (css.parentNode) {
          css.parentNode.removeChild(css);
        }
      });
    });
  };

  cleanup();
  return cleanup;
}
